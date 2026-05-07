import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import type { RegisterRequest, LoginRequest, AuthResponse, User } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export const authController = {
  sendVerificationCode: async (req: AuthenticatedRequest, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: '请提供手机号' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`验证码发送到 ${phone}: ${code}`);
    return res.json({ success: true, message: '验证码已发送' });
  },

  register: async (req: AuthenticatedRequest, res: Response) => {
    const { phone, code, name, password }: RegisterRequest = req.body;

    if (!phone || !code || !name || !password) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const storedCode = verificationCodes.get(phone);
    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt) {
      return res.status(400).json({ success: false, error: '验证码无效或已过期' });
    }

    const existingUser = await userRepository.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ success: false, error: '该手机号已注册' });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create(userId, phone, name, passwordHash);

    verificationCodes.delete(phone);

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

    const user = await userRepository.findByPhone(phone);
    if (!user) {
      return res.status(400).json({ success: false, error: '用户不存在' });
    }

    let isValid = false;

    if (password) {
      const passwordHash = await userRepository.getPasswordHash(phone);
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

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    return res.json({ success: true, data: user });
  },
};
