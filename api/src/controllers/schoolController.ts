import { Response } from 'express';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { schoolRepository } from '../repositories/schoolRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { subjectRepository } from '../services/subjectService.js';
import { timeConfigRepository } from '../repositories/timeConfigRepository.js';
import { curriculumConfigRepository } from '../repositories/curriculumConfigRepository.js';
import type { CreateSchoolRequest, JoinSchoolRequest, School, AuthResponse, CreateCurriculumConfigRequest } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const schoolController = {
  createSchool: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    const { name, region, type, timeSlots }: any = req.body;
    if (!name || !region || !type) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const schoolId = randomUUID();
    let inviteCode = generateInviteCode();

    // 确保邀请码唯一
    while (schoolRepository.findByInviteCode(inviteCode)) {
      inviteCode = generateInviteCode();
    }

    const school = schoolRepository.create(schoolId, name, region, type, inviteCode, req.user.id);

    // 保存时间配置
    if (timeSlots && Array.isArray(timeSlots)) {
      timeSlots.forEach((slot: any) => {
        timeConfigRepository.create(
          randomUUID(),
          schoolId,
          slot.type,
          slot.startTime,
          slot.endTime
        );
      });
    }

    // 更新用户的学校信息
    userRepository.updateSchool(req.user.id, schoolId);

    // 重新生成 JWT token 以包含新的 schoolId
    const updatedUser = userRepository.findById(req.user.id);
    const token = jwt.sign(
      { id: updatedUser.id, schoolId: updatedUser.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user: updatedUser, token };
    return res.json({ success: true, data: response });
  },

  joinSchool: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    const { inviteCode }: JoinSchoolRequest = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: '请提供邀请码' });
    }

    const school = schoolRepository.findByInviteCode(inviteCode.toUpperCase());
    if (!school) {
      return res.status(404).json({ success: false, error: '邀请码无效' });
    }

    // 更新用户的学校信息
    userRepository.updateSchool(req.user.id, school.id);

    // 重新生成 JWT token 以包含新的 schoolId
    const updatedUser = userRepository.findById(req.user.id);
    const token = jwt.sign(
      { id: updatedUser.id, schoolId: updatedUser.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user: updatedUser, token };
    return res.json({ success: true, data: response });
  },

  getSchool: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const school = schoolRepository.findById(req.user.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, error: '学校不存在' });
    }

    return res.json({ success: true, data: school });
  },

  getSubjects: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const subjects = subjectRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: subjects });
  },

  getTimeConfigs: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const timeConfigs = timeConfigRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: timeConfigs });
  },

  getCurriculumConfigs: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const { subjectId, gradeId } = req.query;
    let configs;
    
    if (subjectId && gradeId) {
      configs = curriculumConfigRepository.findBySubjectAndGrade(
        req.user.schoolId,
        subjectId as string,
        parseInt(gradeId as string)
      );
    } else {
      configs = curriculumConfigRepository.findBySchool(req.user.schoolId);
    }
    
    return res.json({ success: true, data: configs });
  },

  createCurriculumConfig: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const { subjectId, gradeId, version, volumes }: CreateCurriculumConfigRequest = req.body;
    
    if (!subjectId || !gradeId || !version || !volumes || !Array.isArray(volumes)) {
      return res.status(400).json({ success: false, error: '请提供完整的配置信息' });
    }

    const id = randomUUID();
    const config = curriculumConfigRepository.create(
      id,
      req.user.schoolId,
      subjectId,
      gradeId,
      version,
      volumes
    );

    return res.json({ success: true, data: config });
  },

  updateCurriculumConfig: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    const { id } = req.params;
    const { version, volumes } = req.body;

    const config = curriculumConfigRepository.update(id, version, volumes);
    
    if (!config) {
      return res.status(404).json({ success: false, error: '配置不存在' });
    }

    return res.json({ success: true, data: config });
  },

  deleteCurriculumConfig: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    const { id } = req.params;
    curriculumConfigRepository.delete(id);
    
    return res.json({ success: true, data: null });
  }
};
