import { Response } from 'express';
import { classRepository } from '../repositories/classRepository.js';
import { timetableRepository } from '../repositories/timetableRepository.js';
import { horizontalPlanRepository } from '../repositories/horizontalPlanRepository.js';
import { subjectRepository } from '../services/subjectService.js';
import type { ProgressStats } from '../../../shared/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const progressController = {
  getProgress: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.user.schoolId) {
      return res.status(401).json({ success: false, error: '未认证或未加入学校' });
    }

    const [classes, subjects] = await Promise.all([
      classRepository.findBySchool(req.user.schoolId),
      subjectRepository.findBySchool(req.user.schoolId),
    ]);

    // Pre-fetch all timetables and plans
    const classTimetables = new Map<string, any[]>();
    const allPlanIds: string[] = [];

    for (const cls of classes) {
      const timetables = await timetableRepository.findByClass(cls.id);
      classTimetables.set(cls.id, timetables);
      allPlanIds.push(...timetables.map(t => t.id));
    }

    const plans = allPlanIds.length > 0 ? await horizontalPlanRepository.findByTimetableIds(allPlanIds) : [];
    const planSet = new Set(plans.map(p => p.timetableId));

    let totalLessons = 0;
    let preparedLessons = 0;

    const byClass = [];
    for (const cls of classes) {
      const timetables = classTimetables.get(cls.id) || [];
      let classTotal = 0;
      let classPrepared = 0;

      for (const tt of timetables) {
        classTotal++;
        totalLessons++;
        if (planSet.has(tt.id)) {
          classPrepared++;
          preparedLessons++;
        }
      }

      byClass.push({
        classId: cls.id,
        className: cls.name,
        total: classTotal,
        prepared: classPrepared,
      });
    }

    const bySubject = [];
    for (const sub of subjects) {
      let subjectTotal = 0;
      let subjectPrepared = 0;

      for (const cls of classes) {
        const timetables = classTimetables.get(cls.id) || [];
        for (const tt of timetables) {
          if (tt.subjectId === sub.id) {
            subjectTotal++;
            if (planSet.has(tt.id)) {
              subjectPrepared++;
            }
          }
        }
      }

      bySubject.push({
        subjectId: sub.id,
        subjectName: sub.name,
        total: subjectTotal,
        prepared: subjectPrepared,
      });
    }

    const stats: ProgressStats = {
      totalLessons,
      preparedLessons,
      byClass,
      bySubject,
    };

    return res.json({ success: true, data: stats });
  },
};
