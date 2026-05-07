export type SchoolType = '小学' | '初中' | '小学（五•四学制）' | '初中（五•四学制）';

export const ALL_GRADE_LABELS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'];

export const GRADE_TEXT_TO_ID: Record<string, string> = {
  '一年级': '1', '二年级': '2', '三年级': '3', '四年级': '4', '五年级': '5', '六年级': '6',
  '七年级': '7', '八年级': '8', '九年级': '9',
};

export const GRADE_ID_TO_LABEL: Record<string, string> = {
  '1': '一年级', '2': '二年级', '3': '三年级', '4': '四年级', '5': '五年级', '6': '六年级',
  '7': '七年级', '8': '八年级', '9': '九年级',
};

export const GRADE_RANGES: Record<SchoolType, number[]> = {
  '小学': [1, 2, 3, 4, 5, 6],
  '初中': [7, 8, 9],
  '小学（五•四学制）': [1, 2, 3, 4, 5],
  '初中（五•四学制）': [6, 7, 8, 9],
};

export function getAvailableGrades(schoolType?: string): { id: number; label: string }[] {
  const ids = GRADE_RANGES[schoolType as SchoolType] || GRADE_RANGES['小学'];
  return ids.map(id => ({ id, label: ALL_GRADE_LABELS[id - 1] }));
}

export function getSchoolTypeLabel(type: string): string {
  return type || '未设置';
}
