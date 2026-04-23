import { getDb } from '../db/db.js';
import type { Class } from '../../../shared/types.js';

export const classRepository = {
  create: (
    id: string,
    schoolId: string,
    name: string,
    gradeIds: number[],
    type: string
  ): Class => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO classes (id, school_id, name, grade_ids, type) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, name, JSON.stringify(gradeIds), type);
    return classRepository.findById(id)!;
  },

  findById: (id: string): Class | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM classes WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      gradeIds: JSON.parse(row.grade_ids),
      type: row.type,
      createdAt: row.created_at
    };
  },

  findBySchool: (schoolId: string): Class[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM classes WHERE school_id = ?');
    const rows = stmt.all(schoolId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      gradeIds: JSON.parse(row.grade_ids),
      type: row.type,
      createdAt: row.created_at
    }));
  },

  update: (id: string, name: string, gradeIds: number[], type: string): void => {
    const db = getDb();
    const stmt = db.prepare(
      'UPDATE classes SET name = ?, grade_ids = ?, type = ? WHERE id = ?'
    );
    stmt.run(name, JSON.stringify(gradeIds), type, id);
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
  }
};
