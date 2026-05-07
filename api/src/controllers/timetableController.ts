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

    const entries = await timetableRepository.findByClass(classId);

    const timetableIds = entries.map(e => e.id);
    const plans = await horizontalPlanRepository.findByTimetableIds(timetableIds);
    const planSet = new Set(plans.map(p => p.timetableId));

    const entriesWithStatus = entries.map(entry => ({
      ...entry,
      hasPrepared: planSet.has(entry.id),
    }));

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

    if (gradeId !== undefined) {
      await timetableRepository.deleteByPositionAndGrade(classId, dayOfWeek, periodIndex, gradeId);
    } else {
      await timetableRepository.deleteByPosition(classId, dayOfWeek, periodIndex);
    }

    const entryId = randomUUID();
    const entry = await timetableRepository.create(
      entryId,
      classId,
      dayOfWeek,
      periodIndex,
      subjectId,
      req.user.id,
      lessonType || 'new',
      gradeId
    );

    const horizontalPlan = await horizontalPlanRepository.findByTimetable(entry.id);

    return res.json({ success: true, data: { ...entry, hasPrepared: !!horizontalPlan } });
  },

  updateWeeklyTimetable: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const { classId, entries }: UpdateWeeklyTimetableRequest = req.body;

    if (!classId || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: '请提供完整的课程表数据' });
    }

    const existingEntries = await timetableRepository.findByClass(classId);
    const existingIds = existingEntries.map(e => e.id);
    const plans = existingIds.length > 0 ? await horizontalPlanRepository.findByTimetableIds(existingIds) : [];
    const plannedSet = new Set(plans.map(p => p.timetableId));

    // Delete unplanned old entries
    for (const entry of existingEntries) {
      if (!plannedSet.has(entry.id)) {
        await timetableRepository.delete(entry.id);
      }
    }

    // Create or keep entries
    const createdEntries: any[] = [];
    for (const entry of entries) {
      const key = `${entry.dayOfWeek}-${entry.periodIndex}-${entry.gradeId ?? 'null'}`;
      const existing = existingEntries.find(e => {
        return e.dayOfWeek === entry.dayOfWeek && e.periodIndex === entry.periodIndex && (e.gradeId ?? 'null') === (entry.gradeId ?? 'null');
      });

      if (existing && plannedSet.has(existing.id)) {
        createdEntries.push(existing);
        continue;
      }

      const entryId = randomUUID();
      const created = await timetableRepository.create(
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
    await timetableRepository.delete(id);

    return res.json({ success: true, message: '删除成功' });
  },
};
