import { supabase, handleSingle } from '../db/supabase.js';
import type { Class } from '../../../shared/types.js';

function rowToClass(row: any): Class {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    gradeIds: row.grade_ids,
    type: row.type,
    createdAt: row.created_at,
  };
}

export const classRepository = {
  create: async (
    id: string,
    schoolId: string,
    name: string,
    gradeIds: number[],
    type: string
  ): Promise<Class> => {
    const { data, error } = await supabase.from('classes').insert({
      id, school_id: schoolId, name, grade_ids: gradeIds, type,
    }).select('*').single();
    if (error) throw error;
    return rowToClass(data!);
  },

  findById: async (id: string): Promise<Class | null> => {
    const row = handleSingle(await supabase.from('classes').select('*').eq('id', id).single());
    return row ? rowToClass(row) : null;
  },

  findBySchool: async (schoolId: string): Promise<Class[]> => {
    const { data, error } = await supabase.from('classes').select('*').eq('school_id', schoolId);
    if (error) throw error;
    return (data || []).map(rowToClass);
  },

  update: async (id: string, name: string, gradeIds: number[], type: string): Promise<void> => {
    const { error } = await supabase.from('classes').update({ name, grade_ids: gradeIds, type }).eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },
};
