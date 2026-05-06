import { getDb } from '../db/db.js';
import type { TimetableEntry } from '../../../shared/types.js';

const rowToEntry = (row: any): TimetableEntry => ({
  id: row.id,
  classId: row.class_id,
  dayOfWeek: row.day_of_week,
  periodIndex: row.period_index,
  subjectId: row.subject_id,
  teacherId: row.teacher_id,
  lessonType: row.lesson_type,
  gradeId: row.grade_id ?? undefined,
});

export const timetableRepository = {
  create: (
    id: string,
    classId: string,
    dayOfWeek: number,
    periodIndex: number,
    subjectId: string,
    teacherId: string,
    lessonType: string,
    gradeId?: number
  ): TimetableEntry => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO timetables (id, class_id, day_of_week, period_index, grade_id, subject_id, teacher_id, lesson_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, classId, dayOfWeek, periodIndex, gradeId ?? null, subjectId, teacherId, lessonType);
    return timetableRepository.findById(id)!;
  },

  findById: (id: string): TimetableEntry | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timetables WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return rowToEntry(row);
  },

  findByClass: (classId: string): TimetableEntry[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timetables WHERE class_id = ? ORDER BY day_of_week, period_index');
    const rows = stmt.all(classId) as any[];
    return rows.map(rowToEntry);
  },

  findByClassAndGrade: (classId: string, gradeId: number): TimetableEntry[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM timetables WHERE class_id = ? AND grade_id = ? ORDER BY day_of_week, period_index');
    const rows = stmt.all(classId, gradeId) as any[];
    return rows.map(rowToEntry);
  },

  findByPosition: (classId: string, dayOfWeek: number, periodIndex: number): TimetableEntry[] => {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_index = ?'
    );
    const rows = stmt.all(classId, dayOfWeek, periodIndex) as any[];
    return rows.map(rowToEntry);
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
  },

  deleteByPositionAndGrade: (classId: string, dayOfWeek: number, periodIndex: number, gradeId: number): void => {
    const db = getDb();
    const stmt = db.prepare(
      'DELETE FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_index = ? AND grade_id = ?'
    );
    stmt.run(classId, dayOfWeek, periodIndex, gradeId);
  },

  /** Delete all entries for a class (used when rebuilding a week's timetable) */
  deleteByClass: (classId: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM timetables WHERE class_id = ?');
    stmt.run(classId);
  },
};
