import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Users,
  Plus
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuthStore, useAppStore } from '../store';

export default function Home() {
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const { school } = useAppStore();

  useEffect(() => {
    setLoading(false);
  }, []);

  const quickActions = [
    {
      title: '课程表',
      icon: Calendar,
      color: 'bg-blue-500',
      path: '/timetable'
    },
    {
      title: '纵向备课',
      icon: BookOpen,
      color: 'bg-green-500',
      path: '/lesson-plans'
    },
    {
      title: '班级管理',
      icon: Users,
      color: 'bg-purple-500',
      path: '/classes'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部区域 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-4 pt-8 pb-12">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-blue-100 text-sm">欢迎，{user?.name}</p>
              <h1 className="text-white text-xl font-bold">{school?.name}</h1>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-5">
            <p className="text-blue-100 text-sm mb-3">欢迎使用复式教育备课系统</p>
            <p className="text-white text-sm">开始管理您的班级和课程</p>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="px-4 -mt-8">
        <div className="max-w-md mx-auto">
          {/* 快捷入口 */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-gray-900 font-semibold mb-4">快捷入口</h2>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 快速创建 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-gray-900 font-semibold mb-4">快速创建</h2>
            <div className="space-y-3">
              <Link
                to="/create-class"
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">创建班级</p>
                  <p className="text-gray-500 text-sm">管理您的复式班级</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/lesson-plans/new"
                className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">创建备课</p>
                  <p className="text-gray-500 text-sm">开始纵向备课</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
