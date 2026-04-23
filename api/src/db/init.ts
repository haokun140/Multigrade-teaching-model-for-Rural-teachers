import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initDatabase(): Database.Database {
  // 创建或打开数据库文件
  const dbPath = path.join(__dirname, '../../../data.db');
  const db = new Database(dbPath);

  // 设置数据库
  db.pragma('journal_mode = WAL');

  // 创建表
  createTables(db);

  return db;
}

function createTables(db: Database.Database): void {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      school_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 学校表
  db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('primary', 'middle', 'nine-year')),
      invite_code TEXT UNIQUE NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 班级表
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_ids TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('composite', 'single')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 学科表
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      color TEXT DEFAULT '#3B82F6',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 课程表
  db.exec(`
    CREATE TABLE IF NOT EXISTS timetables (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      period_index INTEGER NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      lesson_type TEXT DEFAULT 'new' CHECK(lesson_type IN ('new', 'review', 'practice')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 纵向备课方案表
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_plans (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      unit TEXT NOT NULL,
      title TEXT NOT NULL,
      volume TEXT,
      objectives TEXT,
      steps TEXT,
      total_duration INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
      timetable_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 横向备课方案表
  db.exec(`
    CREATE TABLE IF NOT EXISTS horizontal_plans (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      timetable_id TEXT NOT NULL,
      grade_subjects TEXT NOT NULL,
      lesson_duration INTEGER NOT NULL,
      tracks TEXT,
      interactions TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 时间配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_configs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      type TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 课程配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS curriculum_configs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      volumes TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(school_id, subject_id, grade_id, version)
    )
  `);

  // 索引
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_lesson_plans_school ON lesson_plans(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans(class_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_lesson_plans_timetable ON lesson_plans(timetable_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_horizontal_plans_school ON horizontal_plans(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_horizontal_plans_class ON horizontal_plans(class_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_horizontal_plans_timetable ON horizontal_plans(timetable_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_time_configs_school ON time_configs(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_curriculum_configs_school ON curriculum_configs(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_curriculum_configs_subject ON curriculum_configs(subject_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_curriculum_configs_grade ON curriculum_configs(grade_id)');
}
