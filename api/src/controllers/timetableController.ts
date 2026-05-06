import { Response } from 'express';
import { randomUUID } from 'crypto';
import { timetableRepository } from '../repositories/timetableRepository.js';
import { horizontalPlanRepository } from '../repositories/horizontalPlanRepository.js';
import type { CreateTimetableRequest, UpdateWeeklyTimetableRequest } from '../../../shared/types.js';
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

    const entries = timetableRepository.findByClass(classId);

    // 添加备课状态
    const entriesWithStatus = entries.map(entry => {
      const horizontalPlan = horizontalPlanRepository.findByTimetable(entry.id);
      return {
        ...entry,
        hasPrepared: !!horizontalPlan,
      };
    });

    return res.json({ success: true, data: entriesWithStatus });
  },

  setTimetableEntry: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, dayOfWeek, periodIndex, subjectId, lessonType, gradeId }: CreateTimetableRequest = req.body;

    if (!classId || dayOfWeek === undefined || periodIndex === undefined || !subjectId) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    // 先删除该位置的课程（若指定了年级，则只删除该年级的）
    if (gradeId !== undefined) {
      timetableRepository.deleteByPositionAndGrade(classId, dayOfWeek, periodIndex, gradeId);
    } else {
      timetableRepository.deleteByPosition(classId, dayOfWeek, periodIndex);
    }

    const entryId = randomUUID();
    const entry = timetableRepository.create(
      entryId,
      classId,
      dayOfWeek,
      periodIndex,
      subjectId,
      req.user.id,
      lessonType || 'new',
      gradeId
    );

    // 添加备课状态
    const horizontalPlan = horizontalPlanRepository.findByTimetable(entry.id);

    return res.json({ success: true, data: { ...entry, hasPrepared: !!horizontalPlan } });
  },

  /** 批量更新一整周的课程表（按年级），保留已有备课方案的课程 */
  updateWeeklyTimetable: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, entries }: UpdateWeeklyTimetableRequest = req.body;

    if (!classId || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: '请提供完整的课程表数据' });
    }

    // 获取现有课程，标记已备课的条目
    const existingEntries = timetableRepository.findByClass(classId);
    const plannedEntries = existingEntries.filter(e => horizontalPlanRepository.findByTimetable(e.id));
    const plannedSet = new Set(plannedEntries.map(e => `${e.dayOfWeek}-${e.periodIndex}-${e.gradeId ?? 'null'}`));

    // 删除未备课的旧条目
    for (const entry of existingEntries) {
      const key = `${entry.dayOfWeek}-${entry.periodIndex}-${entry.gradeId ?? 'null'}`;
      if (!plannedSet.has(key)) {
        timetableRepository.delete(entry.id);
      }
    }

    // 创建或更新条目，跳过已有备课方案的时段
    const createdEntries: any[] = [];
    for (const entry of entries) {
      const key = `${entry.dayOfWeek}-${entry.periodIndex}-${entry.gradeId ?? 'null'}`;
      if (plannedSet.has(key)) {
        // 保留已有备课方案的条目
        const existing = plannedEntries.find(e => {
          return e.dayOfWeek === entry.dayOfWeek && e.periodIndex === entry.periodIndex && (e.gradeId ?? 'null') === (entry.gradeId ?? 'null');
        });
        if (existing) {
          createdEntries.push(existing);
          continue;
        }
      }
      const entryId = randomUUID();
      const created = timetableRepository.create(
        entryId,
        classId,
        entry.dayOfWeek,
        entry.periodIndex,
        entry.subjectId,
        req.user.id,
        entry.lessonType || 'new',
        entry.gradeId
      );
      createdEntries.push(created);
    }

    return res.json({ success: true, data: createdEntries });
  },

  deleteTimetableEntry: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { id } = req.params;
    timetableRepository.delete(id);

    return res.json({ success: true, message: '删除成功' });
  },
};
