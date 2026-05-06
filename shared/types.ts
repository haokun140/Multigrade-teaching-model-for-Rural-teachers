// 用户相关类型
export interface User {
  id: string;
  phone: string;
  name: string;
  schoolId: string | null;
  createdAt: string;
}

export interface RegisterRequest {
  phone: string;
  code: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password?: string;
  code?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 学校相关类型
export interface School {
  id: string;
  name: string;
  region: string;
  type: 'primary' | 'middle' | 'nine-year';
  inviteCode: string;
  rules?: string;
  createdAt: string;
}

export interface CreateSchoolRequest {
  name: string;
  region: string;
  type: 'primary' | 'middle' | 'nine-year';
}

export interface JoinSchoolRequest {
  inviteCode: string;
}

// 班级相关类型
export interface Class {
  id: string;
  schoolId: string;
  name: string;
  gradeIds: number[];
  type: 'composite' | 'single';
  createdAt: string;
}

export interface CreateClassRequest {
  name: string;
  gradeIds: number[];
  type: 'composite' | 'single';
}

// 学科相关类型
export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  isCustom: boolean;
  color: string;
}

// 课程表相关类型
export interface TimetableEntry {
  id: string;
  classId: string;
  dayOfWeek: number; // 1-5, 1=周一
  periodIndex: number;
  subjectId: string;
  teacherId: string;
  lessonType: 'new' | 'review' | 'practice';
  gradeId?: number;
  hasPrepared?: boolean;
}

export interface CreateTimetableRequest {
  classId: string;
  dayOfWeek: number;
  periodIndex: number;
  subjectId: string;
  lessonType: 'new' | 'review' | 'practice';
  gradeId?: number;
}

export interface UpdateWeeklyTimetableRequest {
  classId: string;
  entries: Array<{
    dayOfWeek: number;
    periodIndex: number;
    subjectId: string;
    lessonType: 'new' | 'review' | 'practice';
    gradeId?: number;
  }>;
}

// 纵向备课相关类型
export interface LessonObjective {
  id: string;
  content: string;
  sortOrder: number;
}

export interface LessonStep {
  id: string;
  planId: string;
  name: string;
  detail: string;
  type: 'dynamic' | 'static';
  duration: number;
  materials: string;
  hasAssistant: boolean;
  sortOrder: number;
}

export interface LessonPlan {
  id: string;
  schoolId: string;
  classId: string | null;
  subjectId: string;
  gradeId: number;
  unit: string;
  title: string;
  version?: string;
  volume?: string;
  objectives: LessonObjective[];
  steps: LessonStep[];
  totalDuration: number;
  status: 'draft' | 'completed';
  timetableId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonPlanRequest {
  classId?: string;
  subjectId: string;
  gradeId: number;
  unit: string;
  title: string;
  version?: string;
  volume?: string;
  timetableId?: string;
  objectives?: LessonObjective[];
  steps?: LessonStep[];
  totalDuration?: number;
  status?: 'draft' | 'completed';
}

export interface UpdateLessonPlanRequest {
  unit?: string;
  title?: string;
  version?: string;
  volume?: string;
  objectives?: LessonObjective[];
  steps?: LessonStep[];
  status?: 'draft' | 'completed';
  timetableId?: string;
}

// 横向备课相关类型
export interface TimelineBlock {
  stepId?: string;
  name: string;
  type: 'dynamic' | 'static' | 'interaction';
  start: number;
  duration: number;
}

export interface TimelineTrack {
  gradeId: number;
  subjectId: string;
  blocks: TimelineBlock[];
}

export interface Interaction {
  name: string;
  description: string;
  start: number;
  duration: number;
}

export interface HorizontalPlan {
  id: string;
  schoolId: string;
  classId: string;
  timetableId: string;
  gradeSubjects: Array<{ gradeId: number; subjectId: string }>;
  lessonDuration: number;
  lessonDate?: string;
  tracks: TimelineTrack[];
  interactions: Interaction[];
  homework: Array<{ gradeId: number; content: string }>;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateHorizontalPlanRequest {
  classId: string;
  timetableId: string;
  gradeSubjects: Array<{ gradeId: number; subjectId: string }>;
  lessonDuration: number;
  lessonDate?: string;
}

export interface UpdateHorizontalPlanRequest {
  tracks?: TimelineTrack[];
  interactions?: Interaction[];
  homework?: Array<{ gradeId: number; content: string }>;
  status?: 'draft' | 'completed';
  lessonDate?: string;
}

// 进度统计类型
export interface ProgressStats {
  totalLessons: number;
  preparedLessons: number;
  byClass: Array<{
    classId: string;
    className: string;
    total: number;
    prepared: number;
  }>;
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    total: number;
    prepared: number;
  }>;
}

// 学科-版本-年级-册次关联配置类型
export interface CurriculumConfig {
  id: string;
  schoolId: string;
  subjectId: string;
  gradeId: number;
  version: string;
  volumes: string[];
  createdAt: string;
}

export interface CreateCurriculumConfigRequest {
  subjectId: string;
  gradeId: number;
  version: string;
  volumes: string[];
}