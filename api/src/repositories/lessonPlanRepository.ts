import { supabase, handleSingle } from '../db/supabase.js';
import type { LessonPlan } from '../../../shared/types.js';

function rowToPlan(row: any): LessonPlan {
  return {
    id: row.id,
    schoolId: row.school_id,
    classId: row.class_id,
    subjectId: row.subject_id,
    gradeId: row.grade_id,
    unit: row.unit,
    title: row.title,
    version: row.version,
    volume: row.volume,
    objectives: row.objectives || [],
    steps: row.steps || [],
    totalDuration: row.total_duration,
    status: row.status,
    timetableId: row.timetable_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const lessonPlanRepository = {
  create: async (
    id: string,
    schoolId: string,
    classId: string | null,
    subjectId: string,
    gradeId: number,
    unit: string,
    title: string,
    volume: string | null = null,
    timetableId: string | null = null,
    objectives: any[] = [],
    steps: any[] = [],
    totalDuration: number = 0,
    status: string = 'draft',
    version: string | null = null
  ): Promise<LessonPlan> => {
    const { data, error } = await supabase.from('lesson_plans').insert({
      id, school_id: schoolId, class_id: classId || null, subject_id: subjectId,
      grade_id: gradeId, unit, title, volume, timetable_id: timetableId,
      objectives, steps, total_duration: totalDuration, status, version,
    }).select('*').single();
    if (error) throw error;
    return rowToPlan(data!);
  },

  findById: async (id: string): Promise<LessonPlan | null> => {
    const row = handleSingle(await supabase.from('lesson_plans').select('*').eq('id', id).single());
    return row ? rowToPlan(row) : null;
  },

  findByClassAndGradeAndSubject: async (
    classId: string,
    gradeId: number,
    subjectId: string
  ): Promise<LessonPlan[]> => {
    const { data, error } = await supabase.from('lesson_plans').select('*').eq('class_id', classId).eq('grade_id', gradeId).eq('subject_id', subjectId).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToPlan);
  },

  findBySchoolGradeAndSubject: async (
    schoolId: string,
    gradeId: number,
    subjectId: string
  ): Promise<LessonPlan[]> => {
    const { data, error } = await supabase.from('lesson_plans').select('*').eq('school_id', schoolId).eq('grade_id', gradeId).eq('subject_id', subjectId).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToPlan);
  },

  update: async (id: string, data: Partial<Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    const fields: Record<string, unknown> = {};

    if (data.unit !== undefined) fields.unit = data.unit;
    if (data.title !== undefined) fields.title = data.title;
    if (data.version !== undefined) fields.version = data.version;
    if (data.volume !== undefined) fields.volume = data.volume;
    if (data.objectives !== undefined) fields.objectives = data.objectives;
    if (data.steps !== undefined) {
      fields.steps = data.steps;
      fields.total_duration = data.steps.reduce((sum, step) => sum + step.duration, 0);
    }
    if (data.status !== undefined) fields.status = data.status;
    if (data.timetableId !== undefined) fields.timetable_id = data.timetableId;

    if (Object.keys(fields).length > 0) {
      fields.updated_at = new Date().toISOString();
      const { error } = await supabase.from('lesson_plans').update(fields).eq('id', id);
      if (error) throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
    if (error) throw error;
  },

  findBySchool: async (schoolId: string): Promise<LessonPlan[]> => {
    const { data, error } = await supabase.from('lesson_plans').select('*').eq('school_id', schoolId).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToPlan);
  },
};
