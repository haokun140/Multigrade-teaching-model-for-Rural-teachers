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

    while (await schoolRepository.findByInviteCode(inviteCode)) {
      inviteCode = generateInviteCode();
    }

    const school = await schoolRepository.create(schoolId, name, region, type, inviteCode, req.user.id);

    if (timeSlots && Array.isArray(timeSlots)) {
      for (const slot of timeSlots) {
        await timeConfigRepository.create(
          randomUUID(),
          schoolId,
          slot.type,
          slot.startTime,
          slot.endTime
        );
      }
    }

    await userRepository.updateSchool(req.user.id, schoolId);

    const updatedUser = await userRepository.findById(req.user.id);
    const token = jwt.sign(
      { id: updatedUser!.id, schoolId: updatedUser!.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user: updatedUser!, token };
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

    const school = await schoolRepository.findByInviteCode(inviteCode.toUpperCase());
    if (!school) {
      return res.status(404).json({ success: false, error: '邀请码无效' });
    }

    await userRepository.updateSchool(req.user.id, school.id);

    const updatedUser = await userRepository.findById(req.user.id);
    const token = jwt.sign(
      { id: updatedUser!.id, schoolId: updatedUser!.schoolId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const response: AuthResponse = { user: updatedUser!, token };
    return res.json({ success: true, data: response });
  },

  getSchool: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const school = await schoolRepository.findById(req.user.schoolId);
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

    const subjects = await subjectRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: subjects });
  },

  getTimeConfigs: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const timeConfigs = await timeConfigRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: timeConfigs });
  },

  updateTimeConfigs: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }

    if (!req.user.schoolId) {
      return res.status(400).json({ success: false, error: '未加入学校' });
    }

    const { timeSlots } = req.body;
    if (!timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ success: false, error: '请提供有效的时间配置' });
    }

    await timeConfigRepository.deleteBySchool(req.user.schoolId);
    for (const slot of timeSlots) {
      await timeConfigRepository.create(
        slot.id || randomUUID(),
        req.user.schoolId,
        slot.type,
        slot.startTime,
        slot.endTime
      );
    }

    const updatedConfigs = await timeConfigRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: updatedConfigs });
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
      configs = await curriculumConfigRepository.findBySubjectAndGrade(
        req.user.schoolId,
        subjectId as string,
        parseInt(gradeId as string)
      );
    } else {
      configs = await curriculumConfigRepository.findBySchool(req.user.schoolId);
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
    const config = await curriculumConfigRepository.create(
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

    const config = await curriculumConfigRepository.update(id, version, volumes);

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
    await curriculumConfigRepository.delete(id);

    return res.json({ success: true, data: null });
  },
};
