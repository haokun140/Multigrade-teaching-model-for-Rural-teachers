import { supabase } from '../db/supabase.js';
import type { Subject } from '../../../shared/types.js';

const PG_UNIQUE_VIOLATION = '23505';

const defaultSubjects = [
  { id: 'sub_chinese', name: '语文', color: '#EF4444' },
  { id: 'sub_math', name: '数学', color: '#3B82F6' },
  { id: 'sub_english', name: '英语', color: '#10B981' },
  { id: 'sub_science', name: '科学', color: '#8B5CF6' },
  { id: 'sub_moral', name: '道德与法治', color: '#F59E0B' },
  { id: 'sub_music', name: '音乐', color: '#EC4899' },
  { id: 'sub_art', name: '美术', color: '#06B6D4' },
  { id: 'sub_physical', name: '体育', color: '#84CC16' },
];

export async function createDefaultSubjects(schoolId: string): Promise<void> {
  const rows = defaultSubjects.map(s => ({
    id: `${s.id}_${schoolId}`,
    school_id: schoolId,
    name: s.name,
    is_custom: false,
    color: s.color,
  }));

  const { error } = await supabase.from('subjects').insert(rows);
  if (error && error.code !== PG_UNIQUE_VIOLATION) throw error;
}

function rowToSubject(row: any): Subject {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    isCustom: row.is_custom,
    color: row.color,
  };
}

export const subjectRepository = {
  findBySchool: async (schoolId: string): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
    if (error) throw error;
    return (data || []).map(rowToSubject);
  },

  create: async (
    id: string,
    schoolId: string,
    name: string,
    color: string = '#3B82F6'
  ): Promise<Subject> => {
    const { data, error } = await supabase.from('subjects').insert({
      id, school_id: schoolId, name, is_custom: true, color,
    }).select('*').single();
    if (error) throw error;
    return rowToSubject(data!);
  },
};
