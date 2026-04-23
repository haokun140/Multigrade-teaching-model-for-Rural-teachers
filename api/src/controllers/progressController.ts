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

    const classes = classRepository.findBySchool(req.user.schoolId);
    const subjects = subjectRepository.findBySchool(req.user.schoolId);

    let totalLessons = 0;
    let preparedLessons = 0;

    // 按班级统计
    const byClass = classes.map(cls => {
      const timetables = timetableRepository.findByClass(cls.id);
      let classTotal = 0;
      let classPrepared = 0;

      timetables.forEach(tt => {
        classTotal++;
        totalLessons++;
        const hasPlan = !!horizontalPlanRepository.findByTimetable(tt.id);
        if (hasPlan) {
          classPrepared++;
          preparedLessons++;
        }
      });

      return {
        classId: cls.id,
        className: cls.name,
        total: classTotal,
        prepared: classPrepared
      };
    });

    // 按学科统计
    const bySubject = subjects.map(sub => {
      let subjectTotal = 0;
      let subjectPrepared = 0;

      classes.forEach(cls => {
        const timetables = timetableRepository.findByClass(cls.id);
        timetables.forEach(tt => {
          if (tt.subjectId === sub.id) {
            subjectTotal++;
            const hasPlan = !!horizontalPlanRepository.findByTimetable(tt.id);
            if (hasPlan) {
              subjectPrepared++;
            }
          }
        });
      });

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        total: subjectTotal,
        prepared: subjectPrepared
      };
    });

    const stats: ProgressStats = {
      totalLessons,
      preparedLessons,
      byClass,
      bySubject
    };

    return res.json({ success: true, data: stats });
  }
};
