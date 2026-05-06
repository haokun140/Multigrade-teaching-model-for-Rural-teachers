import { getDb } from '../db/db.js';
import type { LessonPlan } from '../../../shared/types.js';

export const lessonPlanRepository = {
  create: (
    id: string,
    schoolId: string,
    classId: string,
    subjectId: string,
    gradeId: number,
    unit: string,
    title: string,
    volume: string | null = null,
    timetableId: string | null = null
  ): LessonPlan => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO lesson_plans (id, school_id, class_id, subject_id, grade_id, unit, title, volume, timetable_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, classId, subjectId, gradeId, unit, title, volume, timetableId);
    return lessonPlanRepository.findById(id)!;
  },

  findById: (id: string): LessonPlan | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM lesson_plans WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      unit: row.unit,
      title: row.title,
      volume: row.volume,
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      steps: row.steps ? JSON.parse(row.steps) : [],
      totalDuration: row.total_duration,
      status: row.status,
      timetableId: row.timetable_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findByClassAndGradeAndSubject: (
    classId: string,
    gradeId: number,
    subjectId: string
  ): LessonPlan[] => {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM lesson_plans WHERE class_id = ? AND grade_id = ? AND subject_id = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(classId, gradeId, subjectId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      unit: row.unit,
      title: row.title,
      volume: row.volume,
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      steps: row.steps ? JSON.parse(row.steps) : [],
      totalDuration: row.total_duration,
      status: row.status,
      timetableId: row.timetable_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  update: (id: string, data: Partial<Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>>): void => {
    const db = getDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (data.unit !== undefined) {
      updates.push('unit = ?');
      params.push(data.unit);
    }
    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.volume !== undefined) {
      updates.push('volume = ?');
      params.push(data.volume);
    }
    if (data.objectives !== undefined) {
      updates.push('objectives = ?');
      params.push(JSON.stringify(data.objectives));
    }
    if (data.steps !== undefined) {
      updates.push('steps = ?');
      params.push(JSON.stringify(data.steps));
      // 计算总时长
      const totalDuration = data.steps.reduce((sum, step) => sum + step.duration, 0);
      updates.push('total_duration = ?');
      params.push(totalDuration);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.timetableId !== undefined) {
      updates.push('timetable_id = ?');
      params.push(data.timetableId);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      const stmt = db.prepare(`UPDATE lesson_plans SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
    }
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM lesson_plans WHERE id = ?');
    stmt.run(id);
  },

  findBySchool: (schoolId: string): LessonPlan[] => {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM lesson_plans WHERE school_id = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(schoolId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      unit: row.unit,
      title: row.title,
      volume: row.volume,
      objectives: row.objectives ? JSON.parse(row.objectives) : [],
      steps: row.steps ? JSON.parse(row.steps) : [],
      totalDuration: row.total_duration,
      status: row.status,
      timetableId: row.timetable_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
};
