import { getDb } from '../db/db.js';
import type { User } from '../../../shared/types.js';

export const userRepository = {
  create: (id: string, phone: string, name: string, passwordHash: string): User => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO users (id, phone, name, password_hash) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, phone, name, passwordHash);
    return userRepository.findById(id)!;
  },

  findById: (id: string): User | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      schoolId: row.school_id,
      createdAt: row.created_at
    };
  },

  findByPhone: (phone: string): User | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    const row = stmt.get(phone) as any;
    if (!row) return null;
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      schoolId: row.school_id,
      createdAt: row.created_at
    };
  },

  updateSchool: (userId: string, schoolId: string | null): void => {
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET school_id = ? WHERE id = ?');
    stmt.run(schoolId, userId);
  },

  getPasswordHash: (phone: string): string | null => {
    const db = getDb();
    const stmt = db.prepare('SELECT password_hash FROM users WHERE phone = ?');
    const row = stmt.get(phone) as any;
    return row ? row.password_hash : null;
  }
};
