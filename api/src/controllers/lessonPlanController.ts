import { Response } from 'express';
import { randomUUID } from 'crypto';
import { lessonPlanRepository } from '../repositories/lessonPlanRepository.js';
import type { CreateLessonPlanRequest, UpdateLessonPlanRequest } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const lessonPlanController = {
  getLessonPlans: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, gradeId, subjectId } = req.query;
    if (!classId || !gradeId || !subjectId) {
      return res.status(400).json({ success: false, error: '请提供班级、年级和学科ID' });
    }

    const plans = lessonPlanRepository.findByClassAndGradeAndSubject(
      classId as string,
      Number(gradeId),
      subjectId as string
    );

    return res.json({ success: true, data: plans });
  },

  getLessonPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const plan = lessonPlanRepository.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '备课方案不存在' });
    }

    return res.json({ success: true, data: plan });
  },

  createLessonPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, subjectId, gradeId, unit, title, volume, timetableId }: CreateLessonPlanRequest = req.body;
    if (!classId || !subjectId || gradeId === undefined || !unit || !title) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    const planId = randomUUID();
    const plan = lessonPlanRepository.create(
      planId,
      req.user.schoolId,
      classId,
      subjectId,
      gradeId,
      unit,
      title,
      volume,
      timetableId
    );

    return res.json({ success: true, data: plan });
  },

  updateLessonPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingPlan = lessonPlanRepository.findById(id);
    if (!existingPlan || existingPlan.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '备课方案不存在' });
    }

    const updateData: UpdateLessonPlanRequest = req.body;
    lessonPlanRepository.update(id, updateData);

    const updatedPlan = lessonPlanRepository.findById(id);
    return res.json({ success: true, data: updatedPlan });
  },

  deleteLessonPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingPlan = lessonPlanRepository.findById(id);
    if (!existingPlan || existingPlan.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '备课方案不存在' });
    }

    lessonPlanRepository.delete(id);
    return res.json({ success: true, message: '删除成功' });
  },

  copyLessonPlan: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    const existingPlan = lessonPlanRepository.findById(id);
    if (!existingPlan || existingPlan.schoolId !== req.user.schoolId) {
      return res.status(404).json({ success: false, error: '备课方案不存在' });
    }

    const newPlanId = randomUUID();
    const newPlan = lessonPlanRepository.create(
      newPlanId,
      req.user.schoolId,
      existingPlan.classId,
      existingPlan.subjectId,
      existingPlan.gradeId,
      existingPlan.unit,
      `${existingPlan.title} (副本)`,
      existingPlan.volume,
      null
    );

    // 复制内容
    lessonPlanRepository.update(newPlanId, {
      objectives: existingPlan.objectives,
      steps: existingPlan.steps,
      status: 'draft'
    });

    const copiedPlan = lessonPlanRepository.findById(newPlanId);
    return res.json({ success: true, data: copiedPlan });
  },

  getAllLessonPlans: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const plans = lessonPlanRepository.findBySchool(req.user.schoolId);
    return res.json({ success: true, data: plans });
  }
};
