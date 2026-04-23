import { Response } from 'express';
import { randomUUID } from 'crypto';
import { timetableRepository } from '../repositories/timetableRepository.js';
import { lessonPlanRepository } from '../repositories/lessonPlanRepository.js';
import { horizontalPlanRepository } from '../repositories/horizontalPlanRepository.js';
import type { CreateTimetableRequest, TimetableEntry } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const timetableController = {
  getTimetable: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId } = req.params;
    if (!classId) {
      return res.status(400).json({ success: false, error: '请提供班级ID' });
    }

    let entries = timetableRepository.findByClass(classId);

    // 添加备课状态
    const entriesWithStatus: (TimetableEntry & { hasPrepared?: boolean })[] = entries.map(entry => {
      const lessonPlan = lessonPlanRepository.findById(entry.id); // 这里我们可以通过timetable_id来查找
      const horizontalPlan = horizontalPlanRepository.findByTimetable(entry.id);
      return {
        ...entry,
        hasPrepared: !!horizontalPlan
      };
    });

    return res.json({ success: true, data: entriesWithStatus });
  },

  setTimetableEntry: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, dayOfWeek, periodIndex, subjectId, lessonType }: CreateTimetableRequest = req.body;

    if (!classId || dayOfWeek === undefined || periodIndex === undefined || !subjectId) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    // 先删除该位置的课程
    timetableRepository.deleteByPosition(classId, dayOfWeek, periodIndex);

    const entryId = randomUUID();
    const entry = timetableRepository.create(
      entryId,
      classId,
      dayOfWeek,
      periodIndex,
      subjectId,
      req.user.id,
      lessonType || 'new'
    );

    return res.json({ success: true, data: entry });
  },

  deleteTimetableEntry: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    timetableRepository.delete(id);

    return res.json({ success: true, message: '删除成功' });
  }
};
