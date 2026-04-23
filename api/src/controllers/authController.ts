import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import type { RegisterRequest, LoginRequest, AuthResponse, User } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// 简单的验证码存储（生产环境应该使用 Redis）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export const authController = {
  sendVerificationCode: async (req: AuthenticatedRequest, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: '请提供手机号' });
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`验证码发送到 ${phone}: ${code}`);
    return res.json({ success: true, message: '验证码已发送' });
  },

  register: async (req: AuthenticatedRequest, res: Response) => {
    const { phone, code, name, password }: RegisterRequest = req.body;

    // 验证
    if (!phone || !code || !name || !password) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    // 检查验证码
    const storedCode = verificationCodes.get(phone);
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt) {
      return res.status(400).json({ success: false, error: '验证码无效或已过期' });
    }

    // 检查用户是否已存在
    const existingUser = userRepository.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, error: '该手机号已注册' });
    }

    // 创建用户
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepository.create(userId, phone, name, passwordHash);

    // 清除验证码
    verificationCodes.delete(phone);

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, schoolId: user.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user, token };
    return res.json({ success: true, data: response });
  },

  login: async (req: AuthenticatedRequest, res: Response) => {
    const { phone, password, code }: LoginRequest = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: '请提供手机号' });
    }

    const user = userRepository.findByPhone(phone);
    if (!user) {
      return res.status(400).json({ success: false, error: '用户不存在' });
    }

    let isValid = false;

    if (password) {
      const passwordHash = userRepository.getPasswordHash(phone);
      if (passwordHash) {
        isValid = await bcrypt.compare(password, passwordHash);
      }
    } else if (code) {
      const storedCode = verificationCodes.get(phone);
      if (storedCode && storedCode.code === code && Date.now() <= storedCode.expiresAt) {
        isValid = true;
        verificationCodes.delete(phone);
      }
    }

    if (!isValid) {
      return res.status(400).json({ success: false, error: '密码或验证码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, schoolId: user.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user, token };
    return res.json({ success: true, data: response });
  },

  getMe: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    const user = userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    return res.json({ success: true, data: user });
  }
};
