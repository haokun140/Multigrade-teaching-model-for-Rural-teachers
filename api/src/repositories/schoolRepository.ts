import { getDb } from '../db/db.js';
import type { School } from '../../../shared/types.js';
import { createDefaultSubjects } from '../services/subjectService.js';

export const schoolRepository = {
  create: (
    id: string,
    name: string,
    region: string,
    type: string,
    inviteCode: string,
    createdBy: string
  ): School => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO schools (id, name, region, type, invite_code, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, region, type, inviteCode, createdBy);
    
    // 为新学校创建默认学科
    createDefaultSubjects(id);
    
    return schoolRepository.findById(id)!;
  },

  findById: (id: string): School | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM schools WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      region: row.region,
      type: row.type,
      inviteCode: row.invite_code,
      rules: row.rules || undefined,
      createdAt: row.created_at
    };
  },

  findByInviteCode: (inviteCode: string): School | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM schools WHERE invite_code = ?');
    const row = stmt.get(inviteCode) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      region: row.region,
      type: row.type,
      inviteCode: row.invite_code,
      rules: row.rules || undefined,
      createdAt: row.created_at
    };
  },

  update: (id: string, data: { name?: string; region?: string; type?: string; rules?: string }): School | null => {
    const db = getDb();
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.region !== undefined) { fields.push('region = ?'); params.push(data.region); }
    if (data.type !== undefined) { fields.push('type = ?'); params.push(data.type); }
    if (data.rules !== undefined) { fields.push('rules = ?'); params.push(data.rules); }

    if (fields.length === 0) return schoolRepository.findById(id);

    params.push(id);
    db.prepare(`UPDATE schools SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return schoolRepository.findById(id);
  }
};
