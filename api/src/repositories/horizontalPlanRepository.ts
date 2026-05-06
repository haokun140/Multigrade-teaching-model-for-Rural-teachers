import { getDb } from '../db/db.js';
import type { HorizontalPlan } from '../../../shared/types.js';

export const horizontalPlanRepository = {
  create: (
    id: string,
    schoolId: string,
    classId: string,
    timetableId: string,
    gradeSubjects: Array<{ gradeId: number; subjectId: string }>,
    lessonDuration: number,
    lessonDate?: string
  ): HorizontalPlan => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO horizontal_plans (id, school_id, class_id, timetable_id, grade_subjects, lesson_duration, lesson_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, classId, timetableId, JSON.stringify(gradeSubjects), lessonDuration, lessonDate || null);
    return horizontalPlanRepository.findById(id)!;
  },

  findById: (id: string): HorizontalPlan | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM horizontal_plans WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      classId: row.class_id,
      timetableId: row.timetable_id,
      gradeSubjects: JSON.parse(row.grade_subjects),
      lessonDuration: row.lesson_duration,
      lessonDate: row.lesson_date || undefined,
      tracks: row.tracks ? JSON.parse(row.tracks) : [],
      interactions: row.interactions ? JSON.parse(row.interactions) : [],
      homework: row.homework ? JSON.parse(row.homework) : [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findByTimetable: (timetableId: string): HorizontalPlan | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM horizontal_plans WHERE timetable_id = ? LIMIT 1');
    const row = stmt.get(timetableId) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      classId: row.class_id,
      timetableId: row.timetable_id,
      gradeSubjects: JSON.parse(row.grade_subjects),
      lessonDuration: row.lesson_duration,
      lessonDate: row.lesson_date || undefined,
      tracks: row.tracks ? JSON.parse(row.tracks) : [],
      interactions: row.interactions ? JSON.parse(row.interactions) : [],
      homework: row.homework ? JSON.parse(row.homework) : [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  update: (id: string, data: Partial<Omit<HorizontalPlan, 'id' | 'createdAt' | 'updatedAt'>>): void => {
    const db = getDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (data.tracks !== undefined) {
      updates.push('tracks = ?');
      params.push(JSON.stringify(data.tracks));
    }
    if (data.interactions !== undefined) {
      updates.push('interactions = ?');
      params.push(JSON.stringify(data.interactions));
    }
    if (data.homework !== undefined) {
      updates.push('homework = ?');
      params.push(JSON.stringify(data.homework));
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.lessonDate !== undefined) {
      updates.push('lesson_date = ?');
      params.push(data.lessonDate);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      const stmt = db.prepare(`UPDATE horizontal_plans SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
    }
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM horizontal_plans WHERE id = ?');
    stmt.run(id);
  }
};
