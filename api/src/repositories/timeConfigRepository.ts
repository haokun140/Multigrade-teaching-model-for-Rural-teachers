import { getDb } from '../db/db.js';

interface TimeConfig {
  id: string;
  schoolId: string;
  type: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export const timeConfigRepository = {
  create: (
    id: string,
    schoolId: string,
    type: string,
    startTime: string,
    endTime: string
  ): TimeConfig => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO time_configs (id, school_id, type, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, type, startTime, endTime);
    return timeConfigRepository.findById(id)!;
  },

  findById: (id: string): TimeConfig | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM time_configs WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      type: row.type,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at
    };
  },

  findBySchool: (schoolId: string): TimeConfig[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM time_configs WHERE school_id = ? ORDER BY start_time');
    const rows = stmt.all(schoolId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      type: row.type,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at
    }));
  },

  deleteBySchool: (schoolId: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM time_configs WHERE school_id = ?');
    stmt.run(schoolId);
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM time_configs WHERE id = ?');
    stmt.run(id);
  }
};