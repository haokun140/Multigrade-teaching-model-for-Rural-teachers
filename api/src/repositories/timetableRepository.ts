import { getDb } from '../db/db.js';
import type { TimetableEntry } from '../../../shared/types.js';

export const timetableRepository = {
  create: (
    id: string,
    classId: string,
    dayOfWeek: number,
    periodIndex: number,
    subjectId: string,
    teacherId: string,
    lessonType: string
  ): TimetableEntry => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO timetables (id, class_id, day_of_week, period_index, subject_id, teacher_id, lesson_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, classId, dayOfWeek, periodIndex, subjectId, teacherId, lessonType);
    return timetableRepository.findById(id)!;
  },

  findById: (id: string): TimetableEntry | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timetables WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      classId: row.class_id,
      dayOfWeek: row.day_of_week,
      periodIndex: row.period_index,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      lessonType: row.lesson_type
    };
  },

  findByClass: (classId: string): TimetableEntry[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timetables WHERE class_id = ?');
    const rows = stmt.all(classId) as any[];
    return rows.map(row => ({
      id: row.id,
      classId: row.class_id,
      dayOfWeek: row.day_of_week,
      periodIndex: row.period_index,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      lessonType: row.lesson_type
    }));
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM timetables WHERE id = ?');
    stmt.run(id);
  },

  deleteByPosition: (classId: string, dayOfWeek: number, periodIndex: number): void => {
    const db = getDb();
    const stmt = db.prepare(
      'DELETE FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_index = ?'
    );
    stmt.run(classId, dayOfWeek, periodIndex);
  }
};
