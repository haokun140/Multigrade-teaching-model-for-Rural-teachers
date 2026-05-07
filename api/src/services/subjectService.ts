import { supabase } from '../db/supabase.js';
import type { Subject } from '../../../shared/types.js';

const PG_UNIQUE_VIOLATION = '23505';

const SUBJECT_COLORS: Record<string, string> = {
  '语文': '#EF4444',
  '数学': '#3B82F6',
  '英语': '#10B981',
  '科学': '#8B5CF6',
  '道德与法治': '#F59E0B',
  '体育与健康': '#84CC16',
  '艺术·音乐': '#EC4899',
  '艺术·美术': '#06B6D4',
  '音乐': '#EC4899',
  '美术': '#06B6D4',
  '信息科技': '#6366F1',
  '信息技术': '#6366F1',
  '物理': '#F97316',
  '化学': '#14B8A6',
  '生物学': '#A855F7',
  '生物': '#A855F7',
  '历史': '#EAB308',
  '地理': '#22D3EE',
  '劳动与技术': '#78716C',
  '语文·书法练习指导': '#DC2626',
};

const SUBJECT_KEY_MAP: Record<string, string> = {
  '语文': 'chinese',
  '数学': 'math',
  '英语': 'english',
  '科学': 'science',
  '道德与法治': 'moral',
  '体育与健康': 'physical_health',
  '艺术·音乐': 'art_music',
  '艺术·美术': 'art_visual',
  '音乐': 'music',
  '美术': 'art',
  '信息科技': 'info_tech',
  '信息技术': 'info_tech',
  '物理': 'physics',
  '化学': 'chemistry',
  '生物学': 'biology',
  '生物': 'biology',
  '历史': 'history',
  '地理': 'geography',
  '劳动与技术': 'labor_tech',
  '语文·书法练习指导': 'calligraphy',
};

const STAGE_SUBJECTS: Record<string, string[]> = {
  '小学': [
    '语文', '数学', '英语', '科学', '道德与法治',
    '体育与健康', '艺术·音乐', '艺术·美术', '信息科技',
  ],
  '初中': [
    '语文', '数学', '英语', '物理', '化学',
    '生物学', '历史', '地理', '道德与法治',
    '体育与健康', '艺术·音乐', '艺术·美术', '信息技术',
  ],
  '小学（五•四学制）': [
    '语文', '数学', '英语', '科学', '道德与法治',
    '体育与健康', '艺术·音乐', '艺术·美术',
  ],
  '初中（五•四学制）': [
    '语文', '数学', '英语', '物理', '化学',
    '生物学', '历史', '地理', '道德与法治',
    '体育与健康', '艺术·音乐', '艺术·美术',
  ],
};

function getDefaultSubjects(stage: string) {
  const subjects = STAGE_SUBJECTS[stage] || STAGE_SUBJECTS['小学'];
  return subjects.map(name => ({
    key: SUBJECT_KEY_MAP[name] || name,
    name,
    color: SUBJECT_COLORS[name] || '#3B82F6',
  }));
}

export async function createDefaultSubjects(schoolId: string, stage?: string): Promise<void> {
  const subjects = getDefaultSubjects(stage || '小学');
  const rows = subjects.map(s => ({
    id: `sub_${s.key}_${schoolId}`,
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
