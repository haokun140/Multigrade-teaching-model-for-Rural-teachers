import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../api';
import { useAuthStore, useAppStore } from '../store';
import type { ProgressStats } from '../types';

export default function Home() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const { school } = useAppStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getProgress();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

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
      title: '查看进度',
      icon: Clock,
      color: 'bg-purple-500',
      path: '/progress'
    }
  ];

  const pendingCount = stats ? stats.totalLessons - stats.preparedLessons : 0;

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

          {/* 统计卡片 */}
          <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-5">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-white/20 rounded animate-pulse w-24"></div>
                <div className="h-16 bg-white/20 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-blue-100 text-sm mb-3">备课进度</p>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold text-white">
                    {stats ? stats.preparedLessons : 0}
                    <span className="text-lg text-blue-200 font-normal">
                      /{stats ? stats.totalLessons : 0}
                    </span>
                  </div>
                  {pendingCount > 0 ? (
                    <div className="flex items-center bg-orange-500/20 text-orange-200 px-3 py-1.5 rounded-full">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{pendingCount}待备课</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-green-500/20 text-green-200 px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">全部完成</span>
                    </div>
                  )}
                </div>
              </>
            )}
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

          {/* 待办提示 */}
          {pendingCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-orange-800 font-medium mb-1">
                    还有{pendingCount}节课需要准备
                  </h3>
                  <p className="text-orange-600 text-sm">
                    点击课程表查看需要准备的课程
                  </p>
                  <Link
                    to="/timetable"
                    className="inline-flex items-center text-orange-700 text-sm font-medium mt-3 hover:text-orange-800"
                  >
                    查看课程表
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

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
