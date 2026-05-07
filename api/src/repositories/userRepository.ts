import { supabase, handleSingle } from '../db/supabase.js';
import type { User } from '../../../shared/types.js';

function rowToUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    schoolId: row.school_id,
    createdAt: row.created_at,
  };
}

export const userRepository = {
  create: async (id: string, phone: string, name: string, passwordHash: string): Promise<User> => {
    const { data, error } = await supabase.from('users').insert({
      id, phone, name, password_hash: passwordHash,
    }).select('*').single();
    if (error) throw error;
    return rowToUser(data!);
  },

  findById: async (id: string): Promise<User | null> => {
    const row = handleSingle(await supabase.from('users').select('*').eq('id', id).single());
    return row ? rowToUser(row) : null;
  },

  findByPhone: async (phone: string): Promise<User | null> => {
    const row = handleSingle(await supabase.from('users').select('*').eq('phone', phone).single());
    return row ? rowToUser(row) : null;
  },

  updateSchool: async (userId: string, schoolId: string | null): Promise<void> => {
    const { error } = await supabase.from('users').update({ school_id: schoolId }).eq('id', userId);
    if (error) throw error;
  },

  getPasswordHash: async (phone: string): Promise<string | null> => {
    const { data, error } = await supabase.from('users').select('password_hash').eq('phone', phone).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? data.password_hash : null;
  },
};
