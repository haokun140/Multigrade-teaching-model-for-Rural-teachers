-- Supabase PostgreSQL Schema
-- 在 Supabase Dashboard SQL Editor 中执行此文件

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- 用户ID (UUID)
  phone TEXT UNIQUE NOT NULL,       -- 手机号（唯一）
  name TEXT NOT NULL,               -- 姓名
  password_hash TEXT NOT NULL,      -- 密码哈希 (bcrypt)
  school_id TEXT,                   -- 所属学校ID
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

-- ============================================
-- 学校表
-- ============================================
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,              -- 学校ID (UUID)
  name TEXT NOT NULL,               -- 学校名称
  region TEXT NOT NULL,             -- 所在地区
  type TEXT NOT NULL CHECK(type IN ('primary', 'middle', 'nine-year')), -- 学校类型: primary=小学 middle=初中 nine-year=九年一贯制
  invite_code TEXT UNIQUE NOT NULL, -- 邀请码（唯一，6位字母数字）
  created_by TEXT NOT NULL,         -- 创建者用户ID
  rules TEXT,                       -- 学校规则/公告（纯文本）
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

-- ============================================
-- 班级表
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,              -- 班级ID (UUID)
  school_id TEXT NOT NULL,          -- 所属学校ID
  name TEXT NOT NULL,               -- 班级名称（如"三年级1班"）
  grade_ids JSONB NOT NULL,         -- 年级ID数组（复合班可含多个年级）
  type TEXT NOT NULL CHECK(type IN ('composite', 'single')), -- 班级类型: composite=复式班 single=单一年级
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);

-- ============================================
-- 学科表
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,              -- 学科ID (如 sub_chinese_{schoolId})
  school_id TEXT NOT NULL,          -- 所属学校ID
  name TEXT NOT NULL,               -- 学科名称（语文、数学等）
  is_custom BOOLEAN DEFAULT FALSE,  -- 是否为自定义学科
  color TEXT DEFAULT '#3B82F6',     -- 学科颜色标识
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);

-- ============================================
-- 课程表（每日课表）
-- ============================================
CREATE TABLE IF NOT EXISTS timetables (
  id TEXT PRIMARY KEY,              -- 课程条目ID (UUID)
  class_id TEXT NOT NULL,           -- 所属班级ID
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 星期几 (0=周一 至 6=周日)
  period_index INTEGER NOT NULL,    -- 第几节课（从0开始）
  grade_id INTEGER DEFAULT NULL,    -- 年级ID（复式班中区分不同年级的课）
  subject_id TEXT NOT NULL,         -- 学科ID
  teacher_id TEXT NOT NULL,         -- 授课教师用户ID
  lesson_type TEXT DEFAULT 'new' CHECK(lesson_type IN ('new', 'review', 'practice')), -- 课型: new=新授课 review=复习课 practice=练习课
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);

-- ============================================
-- 纵向备课方案表（教案）
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,              -- 教案ID (UUID)
  school_id TEXT NOT NULL,          -- 所属学校ID
  class_id TEXT,                    -- 关联班级ID（可为空，表示学校级教案）
  subject_id TEXT NOT NULL,         -- 学科ID
  grade_id INTEGER NOT NULL,        -- 年级ID
  unit TEXT NOT NULL,               -- 单元名称
  title TEXT NOT NULL,              -- 教案标题
  version TEXT,                     -- 教材版本
  volume TEXT,                      -- 册次（上/下册）
  objectives JSONB DEFAULT '[]',    -- 教学目标数组 [{id, content, sortOrder}]
  steps JSONB DEFAULT '[]',         -- 教学步骤数组 [{id, name, detail, type, duration, materials, hasAssistant, sortOrder}]
  total_duration INTEGER DEFAULT 0, -- 总时长（分钟，由steps中各step.duration自动求和）
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')), -- 状态: draft=草稿 completed=已完成
  timetable_id TEXT,                -- 关联的课程表条目ID
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- 更新时间
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_school ON lesson_plans(school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_timetable ON lesson_plans(timetable_id);

-- ============================================
-- 横向备课方案表（复式班课堂编排）
-- ============================================
CREATE TABLE IF NOT EXISTS horizontal_plans (
  id TEXT PRIMARY KEY,              -- 方案ID (UUID)
  school_id TEXT NOT NULL,          -- 所属学校ID
  class_id TEXT NOT NULL,           -- 所属班级ID
  timetable_id TEXT NOT NULL,       -- 关联的课程表条目ID
  grade_subjects JSONB NOT NULL,    -- 年级-学科配对 [{gradeId, subjectId}]
  lesson_duration INTEGER NOT NULL, -- 课堂总时长（分钟）
  lesson_date TEXT,                 -- 上课日期
  tracks JSONB DEFAULT '[]',        -- 教学轨道 [{gradeId, subjectId, blocks: [{stepId, name, type, start, duration}]}]
  interactions JSONB DEFAULT '[]',  -- 互动环节 [{name, description, start, duration}]
  homework JSONB DEFAULT '[]',      -- 作业安排 [{gradeId, content}]
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')), -- 状态: draft=草稿 completed=已完成
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- 更新时间
);

CREATE INDEX IF NOT EXISTS idx_horizontal_plans_school ON horizontal_plans(school_id);
CREATE INDEX IF NOT EXISTS idx_horizontal_plans_class ON horizontal_plans(class_id);
CREATE INDEX IF NOT EXISTS idx_horizontal_plans_timetable ON horizontal_plans(timetable_id);

-- ============================================
-- 时间配置表（作息时间）
-- ============================================
CREATE TABLE IF NOT EXISTS time_configs (
  id TEXT PRIMARY KEY,              -- 配置ID (UUID)
  school_id TEXT NOT NULL,          -- 所属学校ID
  type TEXT NOT NULL,               -- 时段类型（如"上午"、"下午"、"课间"等）
  start_time TEXT NOT NULL,         -- 开始时间（HH:mm 格式）
  end_time TEXT NOT NULL,           -- 结束时间（HH:mm 格式）
  created_at TIMESTAMPTZ DEFAULT NOW() -- 创建时间
);

CREATE INDEX IF NOT EXISTS idx_time_configs_school ON time_configs(school_id);

-- ============================================
-- 课程配置表（科目-年级-版本-册次关联）
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_configs (
  id TEXT PRIMARY KEY,              -- 配置ID (UUID)
  school_id TEXT NOT NULL,          -- 所属学校ID
  subject_id TEXT NOT NULL,         -- 学科ID
  grade_id INTEGER NOT NULL,        -- 年级ID
  version TEXT NOT NULL,            -- 教材版本（如"部编版"、"人教版"）
  volumes JSONB NOT NULL,           -- 册次列表 ["上册", "下册"]
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 创建时间
  UNIQUE(school_id, subject_id, grade_id, version) -- 同一学校同科目同年级同版本唯一
);

CREATE INDEX IF NOT EXISTS idx_curriculum_configs_school ON curriculum_configs(school_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_configs_subject ON curriculum_configs(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_configs_grade ON curriculum_configs(grade_id);

-- ============================================
-- 教材目录表（全局主数据，非学校范围）
-- ============================================
CREATE TABLE IF NOT EXISTS textbook_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 主键
  stage TEXT NOT NULL,       -- 学段：小学/初中/高中/小学（五•四学制）/初中（五•四学制）
  subject TEXT NOT NULL,     -- 学科名称
  version TEXT NOT NULL,     -- 版本/出版社
  grade TEXT,                -- 年级（可为空，如高中教材无年级概念）
  volume TEXT NOT NULL,      -- 册次
  is_new TEXT,               -- 新/旧教材标记
  name TEXT NOT NULL,        -- 教材全称
  textbook_id TEXT           -- 原始教材ID
);

CREATE INDEX IF NOT EXISTS idx_textbook_subject ON textbook_catalog(subject);
CREATE INDEX IF NOT EXISTS idx_textbook_stage ON textbook_catalog(stage);
