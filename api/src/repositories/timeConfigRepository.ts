import { supabase, handleSingle } from '../db/supabase.js';

interface TimeConfig {
  id: string;
  schoolId: string;
  type: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

function rowToConfig(row: any): TimeConfig {
  return {
    id: row.id,
    schoolId: row.school_id,
    type: row.type,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
  };
}

export const timeConfigRepository = {
  create: async (
    id: string,
    schoolId: string,
    type: string,
    startTime: string,
    endTime: string
  ): Promise<TimeConfig> => {
    const { data, error } = await supabase.from('time_configs').insert({
      id, school_id: schoolId, type, start_time: startTime, end_time: endTime,
    }).select('*').single();
    if (error) throw error;
    return rowToConfig(data!);
  },

  findById: async (id: string): Promise<TimeConfig | null> => {
    const row = handleSingle(await supabase.from('time_configs').select('*').eq('id', id).single());
    return row ? rowToConfig(row) : null;
  },

  findBySchool: async (schoolId: string): Promise<TimeConfig[]> => {
    const { data, error } = await supabase.from('time_configs').select('*').eq('school_id', schoolId).order('start_time');
    if (error) throw error;
    return (data || []).map(rowToConfig);
  },

  deleteBySchool: async (schoolId: string): Promise<void> => {
    const { error } = await supabase.from('time_configs').delete().eq('school_id', schoolId);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('time_configs').delete().eq('id', id);
    if (error) throw error;
  },
};
