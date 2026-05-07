import { supabase, handleSingle } from '../db/supabase.js';

interface CurriculumConfig {
  id: string;
  schoolId: string;
  subjectId: string;
  gradeId: number;
  version: string;
  volumes: string[];
  createdAt: string;
}

function rowToConfig(row: any): CurriculumConfig {
  return {
    id: row.id,
    schoolId: row.school_id,
    subjectId: row.subject_id,
    gradeId: row.grade_id,
    version: row.version,
    volumes: row.volumes,
    createdAt: row.created_at,
  };
}

export const curriculumConfigRepository = {
  create: async (
    id: string,
    schoolId: string,
    subjectId: string,
    gradeId: number,
    version: string,
    volumes: string[]
  ): Promise<CurriculumConfig> => {
    const { data, error } = await supabase.from('curriculum_configs').insert({
      id, school_id: schoolId, subject_id: subjectId, grade_id: gradeId, version, volumes,
    }).select('*').single();
    if (error) throw error;
    return rowToConfig(data!);
  },

  findById: async (id: string): Promise<CurriculumConfig | null> => {
    const row = handleSingle(await supabase.from('curriculum_configs').select('*').eq('id', id).single());
    return row ? rowToConfig(row) : null;
  },

  findBySchool: async (schoolId: string): Promise<CurriculumConfig[]> => {
    const { data, error } = await supabase.from('curriculum_configs').select('*').eq('school_id', schoolId);
    if (error) throw error;
    return (data || []).map(rowToConfig);
  },

  findBySubjectAndGrade: async (schoolId: string, subjectId: string, gradeId: number): Promise<CurriculumConfig[]> => {
    const { data, error } = await supabase.from('curriculum_configs').select('*').eq('school_id', schoolId).eq('subject_id', subjectId).eq('grade_id', gradeId);
    if (error) throw error;
    return (data || []).map(rowToConfig);
  },

  update: async (
    id: string,
    version?: string,
    volumes?: string[]
  ): Promise<CurriculumConfig | null> => {
    const existing = await curriculumConfigRepository.findById(id);
    if (!existing) return null;

    const fields: Record<string, unknown> = {};
    if (version !== undefined) fields.version = version;
    if (volumes !== undefined) fields.volumes = volumes;

    if (Object.keys(fields).length === 0) return existing;

    const { error } = await supabase.from('curriculum_configs').update(fields).eq('id', id);
    if (error) throw error;
    return curriculumConfigRepository.findById(id);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('curriculum_configs').delete().eq('id', id);
    if (error) throw error;
  },

  deleteBySchool: async (schoolId: string): Promise<void> => {
    const { error } = await supabase.from('curriculum_configs').delete().eq('school_id', schoolId);
    if (error) throw error;
  },
};
