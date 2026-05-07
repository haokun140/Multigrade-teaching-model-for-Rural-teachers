import { supabase, handleSingle } from '../db/supabase.js';
import type { TimetableEntry } from '../../../shared/types.js';

const rowToEntry = (row: any): TimetableEntry => ({
  id: row.id,
  classId: row.class_id,
  dayOfWeek: row.day_of_week,
  periodIndex: row.period_index,
  subjectId: row.subject_id,
  teacherId: row.teacher_id,
  lessonType: row.lesson_type,
  gradeId: row.grade_id ?? undefined,
});

export const timetableRepository = {
  create: async (
    id: string,
    classId: string,
    dayOfWeek: number,
    periodIndex: number,
    subjectId: string,
    teacherId: string,
    lessonType: string,
    gradeId?: number
  ): Promise<TimetableEntry> => {
    const { data, error } = await supabase.from('timetables').insert({
      id, class_id: classId, day_of_week: dayOfWeek, period_index: periodIndex,
      grade_id: gradeId ?? null, subject_id: subjectId, teacher_id: teacherId, lesson_type: lessonType,
    }).select('*').single();
    if (error) throw error;
    return rowToEntry(data!);
  },

  findById: async (id: string): Promise<TimetableEntry | null> => {
    const row = handleSingle(await supabase.from('timetables').select('*').eq('id', id).single());
    return row ? rowToEntry(row) : null;
  },

  findByClass: async (classId: string): Promise<TimetableEntry[]> => {
    const { data, error } = await supabase.from('timetables').select('*').eq('class_id', classId).order('day_of_week').order('period_index');
    if (error) throw error;
    return (data || []).map(rowToEntry);
  },

  findByClassAndGrade: async (classId: string, gradeId: number): Promise<TimetableEntry[]> => {
    const { data, error } = await supabase.from('timetables').select('*').eq('class_id', classId).eq('grade_id', gradeId).order('day_of_week').order('period_index');
    if (error) throw error;
    return (data || []).map(rowToEntry);
  },

  findByPosition: async (classId: string, dayOfWeek: number, periodIndex: number): Promise<TimetableEntry[]> => {
    const { data, error } = await supabase.from('timetables').select('*').eq('class_id', classId).eq('day_of_week', dayOfWeek).eq('period_index', periodIndex);
    if (error) throw error;
    return (data || []).map(rowToEntry);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('timetables').delete().eq('id', id);
    if (error) throw error;
  },

  deleteByPosition: async (classId: string, dayOfWeek: number, periodIndex: number): Promise<void> => {
    const { error } = await supabase.from('timetables').delete().eq('class_id', classId).eq('day_of_week', dayOfWeek).eq('period_index', periodIndex);
    if (error) throw error;
  },

  deleteByPositionAndGrade: async (classId: string, dayOfWeek: number, periodIndex: number, gradeId: number): Promise<void> => {
    const { error } = await supabase.from('timetables').delete().eq('class_id', classId).eq('day_of_week', dayOfWeek).eq('period_index', periodIndex).eq('grade_id', gradeId);
    if (error) throw error;
  },

  deleteByClass: async (classId: string): Promise<void> => {
    const { error } = await supabase.from('timetables').delete().eq('class_id', classId);
    if (error) throw error;
  },
};
