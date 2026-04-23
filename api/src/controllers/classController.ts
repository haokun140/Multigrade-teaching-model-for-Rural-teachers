import { Response } from 'express';
import { randomUUID } from 'crypto';
import { classRepository } from '../repositories/classRepository.js';
import type { CreateClassRequest } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const classController = {
  getClasses: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const classes = classRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: classes });
  },

  createClass: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { name, gradeIds, type }: CreateClassRequest = req.body;
    if (!name || !gradeIds || !type) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const classId = randomUUID();
    const newClass = classRepository.create(
      classId,
      req.user.schoolId,
      name,
      gradeIds,
      type
    );

    return res.json({ success: true, data: newClass });
  },

  updateClass: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const { name, gradeIds, type } = req.body;

    const existingClass = classRepository.findById(id);
    if (!existingClass || existingClass.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '班级不存在' });
    }

    classRepository.update(id, name, gradeIds, type);
    const updatedClass = classRepository.findById(id);
    return res.json({ success: true, data: updatedClass });
  },

  deleteClass: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingClass = classRepository.findById(id);
    if (!existingClass || existingClass.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '班级不存在' });
    }

    classRepository.delete(id);
    return res.json({ success: true, message: '删除成功' });
  }
};
