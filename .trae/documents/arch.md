
# 复式教育备课系统 - 技术架构文档

## 1. 架构设计

```mermaid
graph TB
    subgraph Frontend["前端 React"]
        A[用户界面层]
        B[状态管理 Zustand]
        C[路由 React Router]
        D[组件库]
    end

    subgraph Backend["后端 Express"]
        E[API 控制器层]
        F[业务逻辑层]
        G[数据访问层]
    end

    subgraph Database["数据存储"]
        H[(SQLite 数据库)]
    end

    A &lt;--&gt; C
    C &lt;--&gt; B
    B &lt;--&gt; A
    A &lt;--&gt; E
    E &lt;--&gt; F
    F &lt;--&gt; G
    G &lt;--&gt; H
```

## 2. 技术描述

- **前端**: React@18 + TypeScript + Tailwind CSS@3 + Vite
- **初始化工具**: vite-init
- **后端**: Express@4 + TypeScript
- **数据库**: SQLite（轻量级，易于部署）
- **状态管理**: Zustand
- **路由**: React Router DOM@6
- **图标库**: Lucide React
- **日期处理**: Day.js

选择理由：
- 前后端统一使用 TypeScript 提高开发效率和代码质量
- SQLite 适合 MVP 阶段，无需额外数据库服务器
- React + Tailwind 快速构建美观的响应式界面
- 轻量级架构便于后续扩展和部署

## 3. 路由定义

### 前端路由

| 路由路径 | 页面组件 | 用途 |
|---------|----------|------|
| / | HomePage | 首页(工作台) |
| /login | LoginPage | 登录页 |
| /register | RegisterPage | 注册页 |
| /school/setup | SchoolSetupPage | 创建/加入学校 |
| /timetable | TimetablePage | 课程表页 |
| /classes | ClassListPage | 班级管理页 |
| /classes/new | ClassEditPage | 创建班级 |
| /classes/:id/edit | ClassEditPage | 编辑班级 |
| /lesson-plans | LessonPlanListPage | 纵向备课列表页 |
| /lesson-plans/new | LessonPlanEditPage | 创建纵向备课 |
| /lesson-plans/:id/edit | LessonPlanEditPage | 编辑纵向备课 |
| /horizontal-plans/new | HorizontalPlanEditPage | 创建横向备课 |
| /horizontal-plans/:id/edit | HorizontalPlanEditPage | 编辑横向备课 |
| /lesson-cards/:id | LessonCardPage | 课程卡片页 |
| /progress | ProgressPage | 进度看板页 |
| /settings | SettingsPage | 个人设置页 |

### 后端 API 路由

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/send-code | 发送验证码 |
| GET | /api/auth/me | 获取当前用户信息 |
| POST | /api/schools | 创建学校 |
| POST | /api/schools/join | 加入学校 |
| GET | /api/schools/:id | 获取学校详情 |
| GET | /api/classes | 获取班级列表 |
| POST | /api/classes | 创建班级 |
| PUT | /api/classes/:id | 更新班级 |
| DELETE | /api/classes/:id | 删除班级 |
| GET | /api/subjects | 获取学科列表 |
| POST | /api/subjects | 创建学科 |
| GET | /api/timetables | 获取课程表 |
| POST | /api/timetables | 创建课程条目 |
| PUT | /api/timetables/:id | 更新课程条目 |
| DELETE | /api/timetables/:id | 删除课程条目 |
| GET | /api/lesson-plans | 获取备课方案列表 |
| GET | /api/lesson-plans/:id | 获取备课方案详情 |
| POST | /api/lesson-plans | 创建备课方案 |
| PUT | /api/lesson-plans/:id | 更新备课方案 |
| DELETE | /api/lesson-plans/:id | 删除备课方案 |
| POST | /api/lesson-plans/:id/copy | 复制备课方案 |
| GET | /api/horizontal-plans | 获取横向备课列表 |
| GET | /api/horizontal-plans/:id | 获取横向备课详情 |
| POST | /api/horizontal-plans | 创建横向备课 |
| PUT | /api/horizontal-plans/:id | 更新横向备课 |
| DELETE | /api/horizontal-plans/:id | 删除横向备课 |
| GET | /api/progress | 获取备课进度统计 |

## 4. API 定义

### 4.1 类型定义

```typescript
// 用户相关
interface User {
  id: string;
  phone: string;
  name: string;
  schoolId: string | null;
  createdAt: string;
}

interface RegisterRequest {
  phone: string;
  code: string;
  name: string;
  password: string;
}

interface LoginRequest {
  phone: string;
  password?: string;
  code?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// 学校相关
interface School {
  id: string;
  name: string;
  region: string;
  type: 'primary' | 'middle' | 'nine-year';
  inviteCode: string;
  createdAt: string;
}

interface CreateSchoolRequest {
  name: string;
  region: string;
  type: 'primary' | 'middle' | 'nine-year';
}

interface JoinSchoolRequest {
  inviteCode: string;
}

// 班级相关
interface Class {
  id: string;
  schoolId: string;
  name: string;
  gradeIds: number[];
  type: 'composite' | 'single';
  createdAt: string;
}

interface CreateClassRequest {
  name: string;
  gradeIds: number[];
  type: 'composite' | 'single';
}

// 学科相关
interface Subject {
  id: string;
  schoolId: string;
  name: string;
  isCustom: boolean;
  color: string;
}

// 课程表相关
interface TimetableEntry {
  id: string;
  classId: string;
  dayOfWeek: number; // 0-6, 0=周一
  periodIndex: number;
  subjectId: string;
  teacherId: string;
  lessonType: 'new' | 'review' | 'practice';
  hasPrepared: boolean;
}

interface CreateTimetableRequest {
  classId: string;
  dayOfWeek: number;
  periodIndex: number;
  subjectId: string;
  lessonType: 'new' | 'review' | 'practice';
}

// 纵向备课相关
interface LessonObjective {
  id: string;
  content: string;
  sortOrder: number;
}

interface LessonStep {
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

interface LessonPlan {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  gradeId: number;
  unit: string;
  title: string;
  objectives: LessonObjective[];
  steps: LessonStep[];
  totalDuration: number;
  status: 'draft' | 'completed';
  timetableId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateLessonPlanRequest {
  classId: string;
  subjectId: string;
  gradeId: number;
  unit: string;
  title: string;
  timetableId?: string;
}

interface UpdateLessonPlanRequest {
  unit?: string;
  title?: string;
  objectives?: LessonObjective[];
  steps?: LessonStep[];
  status?: 'draft' | 'completed';
  timetableId?: string;
}

// 横向备课相关
interface TimelineBlock {
  stepId?: string;
  name: string;
  type: 'dynamic' | 'static' | 'interaction';
  start: number;
  duration: number;
}

interface TimelineTrack {
  gradeId: number;
  subjectId: string;
  blocks: TimelineBlock[];
}

interface Interaction {
  name: string;
  description: string;
  start: number;
  duration: number;
}

interface HorizontalPlan {
  id: string;
  schoolId: string;
  classId: string;
  timetableId: string;
  gradeSubjects: Array&lt;{ gradeId: number; subjectId: string }&gt;;
  lessonDuration: number;
  tracks: TimelineTrack[];
  interactions: Interaction[];
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface CreateHorizontalPlanRequest {
  classId: string;
  timetableId: string;
  gradeSubjects: Array&lt;{ gradeId: number; subjectId: string }&gt;;
  lessonDuration: number;
}

interface UpdateHorizontalPlanRequest {
  tracks?: TimelineTrack[];
  interactions?: Interaction[];
  status?: 'draft' | 'completed';
}

// 进度统计
interface ProgressStats {
  totalLessons: number;
  preparedLessons: number;
  byClass: Array&lt;{
    classId: string;
    className: string;
    total: number;
    prepared: number;
  }&gt;;
  bySubject: Array&lt;{
    subjectId: string;
    subjectName: string;
    total: number;
    prepared: number;
  }&gt;;
}
```

## 5. 服务器架构

```mermaid
graph LR
    subgraph Express App
        A[请求中间件] --&gt; B[路由层]
        B --&gt; C[控制器层 Controllers]
        C --&gt; D[服务层 Services]
        D --&gt; E[数据层 Repositories]
    end
    
    subgraph Middleware
        M1[认证中间件]
        M2[错误处理中间件]
        M3[CORS 中间件]
        M4[日志中间件]
    end
    
    E &lt;--&gt; F[(SQLite DB)]
    A &lt;--&gt; Middleware
```

### 5.1 目录结构

```
/workspace/
├── src/                    # 前端源码
│   ├── components/         # 可复用组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义 Hooks
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型
│   ├── store/             # Zustand 状态管理
│   ├── api/               # API 调用封装
│   ├── App.tsx            # 根组件
│   └── main.tsx           # 入口文件
├── api/                   # 后端源码
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── repositories/  # 数据访问
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由定义
│   │   ├── models/        # 数据模型
│   │   ├── types/         # TypeScript 类型
│   │   ├── db/            # 数据库相关
│   │   └── index.ts       # 入口文件
│   └── package.json
├── shared/                # 共享类型定义
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 6. 数据模型

### 6.1 实体关系图

```mermaid
erDiagram
    User ||--o{ School : "创建"
    User }o--|| School : "属于"
    School ||--o{ Class : "拥有"
    School ||--o{ Subject : "拥有"
    School ||--o{ LessonPlan : "拥有"
    School ||--o{ HorizontalPlan : "拥有"
    Class ||--o{ TimetableEntry : "拥有"
    Class ||--o{ LessonPlan : "关联"
    Class ||--o{ HorizontalPlan : "关联"
    Subject ||--o{ TimetableEntry : "关联"
    Subject ||--o{ LessonPlan : "关联"
    TimetableEntry ||--o{ LessonPlan : "关联"
    TimetableEntry ||--o{ HorizontalPlan : "关联"
    LessonPlan ||--|{ LessonObjective : "包含"
    LessonPlan ||--|{ LessonStep : "包含"
```

### 6.2 数据库初始化 SQL

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  school_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 学校表
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('primary', 'middle', 'nine-year')),
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 班级表
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade_ids TEXT NOT NULL, -- JSON array
  type TEXT NOT NULL CHECK(type IN ('composite', 'single')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 学科表
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 课程表
CREATE TABLE timetables (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  period_index INTEGER NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  lesson_type TEXT DEFAULT 'new' CHECK(lesson_type IN ('new', 'review', 'practice')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  UNIQUE(class_id, day_of_week, period_index)
);

-- 纵向备课方案表
CREATE TABLE lesson_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  grade_id INTEGER NOT NULL,
  unit TEXT NOT NULL,
  title TEXT NOT NULL,
  objectives TEXT, -- JSON array
  steps TEXT, -- JSON array
  total_duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
  timetable_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (timetable_id) REFERENCES timetables(id)
);

-- 横向备课方案表
CREATE TABLE horizontal_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  timetable_id TEXT NOT NULL,
  grade_subjects TEXT NOT NULL, -- JSON array
  lesson_duration INTEGER NOT NULL,
  tracks TEXT, -- JSON array
  interactions TEXT, -- JSON array
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (timetable_id) REFERENCES timetables(id)
);

-- 索引
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_subjects_school ON subjects(school_id);
CREATE INDEX idx_timetables_class ON timetables(class_id);
CREATE INDEX idx_lesson_plans_school ON lesson_plans(school_id);
CREATE INDEX idx_lesson_plans_class ON lesson_plans(class_id);
CREATE INDEX idx_lesson_plans_subject ON lesson_plans(subject_id);
CREATE INDEX idx_lesson_plans_timetable ON lesson_plans(timetable_id);
CREATE INDEX idx_horizontal_plans_school ON horizontal_plans(school_id);
CREATE INDEX idx_horizontal_plans_class ON horizontal_plans(class_id);
CREATE INDEX idx_horizontal_plans_timetable ON horizontal_plans(timetable_id);
```

### 6.3 初始数据

```sql
-- 默认学科数据
INSERT INTO subjects (id, school_id, name, is_custom, color) VALUES
('sub_chinese', 'temp', '语文', 0, '#EF4444'),
('sub_math', 'temp', '数学', 0, '#3B82F6'),
('sub_english', 'temp', '英语', 0, '#10B981'),
('sub_science', 'temp', '科学', 0, '#8B5CF6'),
('sub_moral', 'temp', '道德与法治', 0, '#F59E0B'),
('sub_music', 'temp', '音乐', 0, '#EC4899'),
('sub_art', 'temp', '美术', 0, '#06B6D4'),
('sub_physical', 'temp', '体育', 0, '#84CC16');
```

## 7. 状态管理 (Zustand)

### 7.1 认证状态

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) =&gt; void;
  logout: () =&gt; void;
  updateUser: (user: Partial&lt;User&gt;) =&gt; void;
}
```

### 7.2 应用状态

```typescript
interface AppState {
  school: School | null;
  classes: Class[];
  subjects: Subject[];
  currentClass: Class | null;
  setSchool: (school: School) =&gt; void;
  setClasses: (classes: Class[]) =&gt; void;
  setSubjects: (subjects: Subject[]) =&gt; void;
  setCurrentClass: (cls: Class) =&gt; void;
}
```

## 8. 关键技术实现

### 8.1 拖拽交互

使用原生 HTML5 拖拽 API 实现：
- 课程表拖放排课
- 教学步骤排序
- 横向备课时间线调整

### 8.2 时间线可视化

- 使用 CSS Grid/Flexbox 构建时间线布局
- 实时计算和渲染动静冲突
- 响应式设计适配不同屏幕

### 8.3 数据持久化

- 本地开发使用 SQLite
- 前后端通过 REST API 通信
- 认证使用 JWT Token

## 9. 开发与构建

### 9.1 脚本命令

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "ts-node-dev api/src/index.ts",
    "build:frontend": "vite build",
    "build:backend": "tsc -p api/tsconfig.json",
    "build": "npm run build:frontend &amp;&amp; npm run build:backend",
    "preview": "vite preview",
    "start": "node api/dist/index.js"
  }
}
```

### 9.2 环境变量

```env
# .env
PORT=3001
VITE_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

