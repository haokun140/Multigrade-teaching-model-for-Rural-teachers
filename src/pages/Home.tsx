import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Users,
  BookMarked,
  UserPlus,
  CalendarDays,
  FileText,
  Layout,
  ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuthStore, useAppStore } from '../store';

const features = [
  {
    title: '纵向备课',
    desc: '按学科进行复式教学设计',
    icon: BookOpen,
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    path: '/lesson-plans'
  },
  {
    title: '课程规划',
    desc: '制定学期课程与课时安排',
    icon: Calendar,
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    path: '/timetable'
  },
  {
    title: '班级管理',
    desc: '管理复式班级与学生信息',
    icon: Users,
    color: 'bg-purple-500',
    bg: 'bg-purple-50',
    path: '/classes'
  }
];

const steps = [
  {
    num: 1,
    title: '确认教材版本',
    desc: '选择您使用的教材与学科',
    icon: BookMarked,
    path: '/curriculum-config'
  },
  {
    num: 2,
    title: '创建班级',
    desc: '建立复式班级并分配年级',
    icon: UserPlus,
    path: '/create-class'
  },
  {
    num: 3,
    title: '配置课程表',
    desc: '设置每周课时与作息时间',
    icon: CalendarDays,
    path: '/timetable/edit'
  },
  {
    num: 4,
    title: '进行纵向备课',
    desc: '按学科编写复式教案',
    icon: FileText,
    path: '/lesson-plans/new'
  },
  {
    num: 5,
    title: '进行课程规划',
    desc: '统筹安排学期教学计划',
    icon: Layout,
    path: '/timetable'
  }
];

export default function Home() {
  const { user } = useAuthStore();
  const { school } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-8">
        <div className="max-w-md mx-auto">
          <p className="text-gray-500 text-sm">下午好，{user?.name}</p>
          <h1 className="text-gray-900 text-xl font-bold mt-1">{school?.name}</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="max-w-md mx-auto space-y-6">

          {/* 常用功能 */}
          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">常用功能</h2>
            <div className="grid grid-cols-3 gap-3">
              {features.map((f) => (
                <Link
                  key={f.title}
                  to={f.path}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className={`${f.bg} w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <f.icon className={`w-5 h-5 ${f.color.replace('bg-', 'text-')}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* 如何开始 */}
          <section>
            <h2 className="text-gray-900 font-semibold text-base mb-3">如何开始</h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {steps.map((step, i) => (
                <Link
                  key={step.num}
                  to={step.path}
                  className={`flex items-center px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                    i < steps.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600">{step.num}</span>
                  </div>
                  <step.icon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
