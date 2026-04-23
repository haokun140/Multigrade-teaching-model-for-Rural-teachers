import { getDb } from '../db/db.js';
import type { Subject } from '../../../shared/types.js';

const defaultSubjects = [
  { id: 'sub_chinese', name: '语文', color: '#EF4444' },
  { id: 'sub_math', name: '数学', color: '#3B82F6' },
  { id: 'sub_english', name: '英语', color: '#10B981' },
  { id: 'sub_science', name: '科学', color: '#8B5CF6' },
  { id: 'sub_moral', name: '道德与法治', color: '#F59E0B' },
  { id: 'sub_music', name: '音乐', color: '#EC4899' },
  { id: 'sub_art', name: '美术', color: '#06B6D4' },
  { id: 'sub_physical', name: '体育', color: '#84CC16' }
];

export function createDefaultSubjects(schoolId: string): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO subjects (id, school_id, name, is_custom, color) VALUES (?, ?, ?, ?, ?)'
  );
  
  for (const subject of defaultSubjects) {
    try {
      stmt.run(
        `${subject.id}_${schoolId}`,
        schoolId,
        subject.name,
        0,
        subject.color
      );
    } catch (e) {
      // 如果已存在，跳过
    }
  }
}

export const subjectRepository = {
  findBySchool: (schoolId: string): Subject[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM subjects WHERE school_id = ?');
    const rows = stmt.all(schoolId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      name: row.name,
      isCustom: Boolean(row.is_custom),
      color: row.color
    }));
  },

  create: (
    id: string,
    schoolId: string,
    name: string,
    color: string = '#3B82F6'
  ): Subject => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO subjects (id, school_id, name, is_custom, color) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, name, 1, color);
    return {
      id,
      schoolId,
      name,
      isCustom: true,
      color
    };
  }
};
