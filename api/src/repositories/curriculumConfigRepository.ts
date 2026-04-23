import { getDb } from '../db/db.js';

interface CurriculumConfig {
  id: string;
  schoolId: string;
  subjectId: string;
  gradeId: number;
  version: string;
  volumes: string[];
  createdAt: string;
}

export const curriculumConfigRepository = {
  create: (
    id: string,
    schoolId: string,
    subjectId: string,
    gradeId: number,
    version: string,
    volumes: string[]
  ): CurriculumConfig => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO curriculum_configs (id, school_id, subject_id, grade_id, version, volumes) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, schoolId, subjectId, gradeId, version, JSON.stringify(volumes));
    return curriculumConfigRepository.findById(id)!;
  },

  findById: (id: string): CurriculumConfig | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM curriculum_configs WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      schoolId: row.school_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      version: row.version,
      volumes: JSON.parse(row.volumes),
      createdAt: row.created_at
    };
  },

  findBySchool: (schoolId: string): CurriculumConfig[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM curriculum_configs WHERE school_id = ?');
    const rows = stmt.all(schoolId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      version: row.version,
      volumes: JSON.parse(row.volumes),
      createdAt: row.created_at
    }));
  },

  findBySubjectAndGrade: (schoolId: string, subjectId: string, gradeId: number): CurriculumConfig[] => {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM curriculum_configs WHERE school_id = ? AND subject_id = ? AND grade_id = ?'
    );
    const rows = stmt.all(schoolId, subjectId, gradeId) as any[];
    return rows.map(row => ({
      id: row.id,
      schoolId: row.school_id,
      subjectId: row.subject_id,
      gradeId: row.grade_id,
      version: row.version,
      volumes: JSON.parse(row.volumes),
      createdAt: row.created_at
    }));
  },

  update: (
    id: string,
    version?: string,
    volumes?: string[]
  ): CurriculumConfig | null => {
    const db = getDb();
    const existing = curriculumConfigRepository.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (version !== undefined) {
      updates.push('version = ?');
      params.push(version);
    }
    if (volumes !== undefined) {
      updates.push('volumes = ?');
      params.push(JSON.stringify(volumes));
    }

    if (updates.length === 0) return existing;

    params.push(id);
    const stmt = db.prepare(
      `UPDATE curriculum_configs SET ${updates.join(', ')} WHERE id = ?`
    );
    stmt.run(...params);
    return curriculumConfigRepository.findById(id);
  },

  delete: (id: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM curriculum_configs WHERE id = ?');
    stmt.run(id);
  },

  deleteBySchool: (schoolId: string): void => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM curriculum_configs WHERE school_id = ?');
    stmt.run(schoolId);
  }
};
