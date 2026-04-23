import { Response } from 'express';
import { randomUUID } from 'crypto';
import { horizontalPlanRepository } from '../repositories/horizontalPlanRepository.js';
import { lessonPlanRepository } from '../repositories/lessonPlanRepository.js';
import type { CreateHorizontalPlanRequest, UpdateHorizontalPlanRequest } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const horizontalPlanController = {
  getHorizontalPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { timetableId } = req.params;
    const plan = horizontalPlanRepository.findByTimetable(timetableId);

    if (!plan) {
      return res.status(404).json({ success: false, error: '横向备课方案不存在' });
    }

    return res.json({ success: true, data: plan });
  },

  getHorizontalPlanById: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const plan = horizontalPlanRepository.findById(id);

    if (!plan) {
      return res.status(404).json({ success: false, error: '横向备课方案不存在' });
    }

    return res.json({ success: true, data: plan });
  },

  createHorizontalPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, timetableId, gradeSubjects, lessonDuration }: CreateHorizontalPlanRequest = req.body;
    if (!classId || !timetableId || !gradeSubjects || lessonDuration === undefined) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const planId = randomUUID();
    const plan = horizontalPlanRepository.create(
      planId,
      req.user.schoolId,
      classId,
      timetableId,
      gradeSubjects,
      lessonDuration
    );

    return res.json({ success: true, data: plan });
  },

  updateHorizontalPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingPlan = horizontalPlanRepository.findById(id);
    if (!existingPlan || existingPlan.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '横向备课方案不存在' });
    }

    const updateData: UpdateHorizontalPlanRequest = req.body;
    horizontalPlanRepository.update(id, updateData);

    const updatedPlan = horizontalPlanRepository.findById(id);
    return res.json({ success: true, data: updatedPlan });
  },

  deleteHorizontalPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingPlan = horizontalPlanRepository.findById(id);
    if (!existingPlan || existingPlan.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '横向备课方案不存在' });
    }

    horizontalPlanRepository.delete(id);
    return res.json({ success: true, message: '删除成功' });
  },

  getLessonPlansForGrades: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId } = req.query;
    if (!classId) {
      return res.status(400).json({ success: false, error: '请提供班级ID' });
    }

    // 这里简化处理，实际应该根据年级和学科筛选
    // 为了演示，我们返回空数组
    return res.json({ success: true, data: [] });
  }
};
