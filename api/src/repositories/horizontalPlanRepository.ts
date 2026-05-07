import { supabase, handleSingle } from '../db/supabase.js';
import type { HorizontalPlan } from '../../../shared/types.js';

function rowToPlan(row: any): HorizontalPlan {
  return {
    id: row.id,
    schoolId: row.school_id,
    classId: row.class_id,
    timetableId: row.timetable_id,
    gradeSubjects: row.grade_subjects,
    lessonDuration: row.lesson_duration,
    lessonDate: row.lesson_date || undefined,
    tracks: row.tracks || [],
    interactions: row.interactions || [],
    homework: row.homework || [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const horizontalPlanRepository = {
  create: async (
    id: string,
    schoolId: string,
    classId: string,
    timetableId: string,
    gradeSubjects: Array<{ gradeId: number; subjectId: string }>,
    lessonDuration: number,
    lessonDate?: string
  ): Promise<HorizontalPlan> => {
    const { data, error } = await supabase.from('horizontal_plans').insert({
      id, school_id: schoolId, class_id: classId, timetable_id: timetableId,
      grade_subjects: gradeSubjects, lesson_duration: lessonDuration, lesson_date: lessonDate || null,
    }).select('*').single();
    if (error) throw error;
    return rowToPlan(data!);
  },

  findById: async (id: string): Promise<HorizontalPlan | null> => {
    const row = handleSingle(await supabase.from('horizontal_plans').select('*').eq('id', id).single());
    return row ? rowToPlan(row) : null;
  },

  findByTimetable: async (timetableId: string): Promise<HorizontalPlan | null> => {
    const row = handleSingle(await supabase.from('horizontal_plans').select('*').eq('timetable_id', timetableId).limit(1).single());
    return row ? rowToPlan(row) : null;
  },

  /** Batch lookup by timetable IDs — avoids N+1 */
  findByTimetableIds: async (timetableIds: string[]): Promise<HorizontalPlan[]> => {
    if (timetableIds.length === 0) return [];
    const { data, error } = await supabase.from('horizontal_plans').select('*').in('timetable_id', timetableIds);
    if (error) throw error;
    return (data || []).map(rowToPlan);
  },

  update: async (id: string, data: Partial<Omit<HorizontalPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    const fields: Record<string, unknown> = {};

    if (data.tracks !== undefined) fields.tracks = data.tracks;
    if (data.interactions !== undefined) fields.interactions = data.interactions;
    if (data.homework !== undefined) fields.homework = data.homework;
    if (data.status !== undefined) fields.status = data.status;
    if (data.lessonDate !== undefined) fields.lesson_date = data.lessonDate;

    if (Object.keys(fields).length > 0) {
      fields.updated_at = new Date().toISOString();
      const { error } = await supabase.from('horizontal_plans').update(fields).eq('id', id);
      if (error) throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('horizontal_plans').delete().eq('id', id);
    if (error) throw error;
  },
};
