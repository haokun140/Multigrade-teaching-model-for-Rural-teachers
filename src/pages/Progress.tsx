import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Users, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Timetable as TimetableType, LessonPlan, Subject } from '../types';
import BottomNav from '../components/BottomNav';

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'class' | 'subject'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const DAYS = ['周一', '周二', '周三', '周四', '周五'];

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      if (classesRes.data && classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0].id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const getClassById = (id: string) => classes.find(c => c.id === id);

  const getTotalLessons = () => {
    if (viewMode === 'class') {
      return timetables.filter(t => t.classId === selectedClass).length;
    } else {
      return timetables.length;
    }
  };

  const getPreparedLessons = () => {
    if (viewMode === 'class') {
      return timetables.filter(t => t.classId === selectedClass && t.hasPrepared).length;
    } else {
      return timetables.filter(t => t.hasPrepared).length;
    }
  };

  const getLessonsBySubject = () => {
    const result: Record<string, { total: number; prepared: number }> = {};
    subjects.forEach(s => {
      result[s.id] = { total: 0, prepared: 0 };
    });

    const filteredTimetables = viewMode === 'class'
      ? timetables.filter(t => t.classId === selectedClass)
      : timetables;

    filteredTimetables.forEach(t => {
      if (result[t.subjectId]) {
        result[t.subjectId].total++;
        if (t.hasPrepared) {
          result[t.subjectId].prepared++;
        }
      }
    });

    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const prepared = getPreparedLessons();
  const total = getTotalLessons();
  const percentage = total > 0 ? Math.round((prepared / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            备课进度
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('class')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                viewMode === 'class'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              按班级
            </button>
            <button
              onClick={() => setViewMode('subject')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                viewMode === 'subject'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              按学科
            </button>
          </div>

          {viewMode === 'class' && classes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedClass === cls.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">总体进度</h2>
            <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>已备课 {prepared} 节</span>
            </div>
            <div className="text-gray-500">
              总计 {total} 节
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">按学科统计</h2>
          <div className="space-y-3">
            {Object.entries(getLessonsBySubject()).map(([subjectId, stats]) => {
              const subject = getSubjectById(subjectId);
              const subPercentage = stats.total > 0 ? Math.round((stats.prepared / stats.total) * 100) : 0;
              return (
                <div key={subjectId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{subject?.name || '未知学科'}</span>
                    <span className="text-gray-500">{stats.prepared}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${subPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">本周进度</h2>
          <div className="grid grid-cols-5 gap-2">
            {DAYS.map((day, index) => {
              const dayTimetables = viewMode === 'class'
                ? timetables.filter(t => t.classId === selectedClass && t.dayOfWeek === index + 1)
                : timetables.filter(t => t.dayOfWeek === index + 1);
              const dayPrepared = dayTimetables.filter(t => t.hasPrepared).length;
              const dayTotal = dayTimetables.length;
              const dayPercentage = dayTotal > 0 ? Math.round((dayPrepared / dayTotal) * 100) : 0;

              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{day}</div>
                  <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-sm font-bold ${
                    dayPercentage === 100
                      ? 'bg-green-100 text-green-700'
                      : dayPercentage > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {dayTotal > 0 ? `${dayPrepared}/${dayTotal}` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">最新备课</h2>
          <div className="space-y-3">
            {lessonPlans.slice(0, 5).map(plan => {
              const subject = getSubjectById(plan.subjectId);
              return (
                <div
                  key={plan.id}
                  onClick={() => navigate(`/lesson-plans/${plan.id}`)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                      <div className="text-xs text-gray-500">
                        {subject?.name} · {new Date(plan.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    plan.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {plan.status === 'completed' ? '已发布' : '草稿'}
                  </span>
                </div>
              );
            })}
            {lessonPlans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无备课记录
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Progress;
