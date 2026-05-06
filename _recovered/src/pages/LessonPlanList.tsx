import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, Clock, Eye, Copy, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { LessonPlan, Subject, Class as ClassType } from '../types';
import BottomNav from '../components/BottomNav';

const LessonPlanList: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [subjectsRes, classesRes, lessonPlansRes] = await Promise.all([
        api.getSubjects(),
        api.getClasses(),
        api.getAllLessonPlans(),
      ]);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
      setLessonPlans(lessonPlansRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const handleCopyPlan = async (plan: LessonPlan) =>
 {
    try {
      const newPlan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'> = {
        ...plan,
        title: `${plan.title} (副本)`,
        status: 'draft',
      };
      await api.createLessonPlan(newPlan);
      loadData();
    } catch (error) {
      console.error('复制备课方案失败:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('确定要删除这个备课方案吗？')) return;
    try {
      await api.deleteLessonPlan(id);
      loadData();
    } catch (error) {
      console.error('删除备课方案失败:', error);
    }
  };

  const filteredPlans = lessonPlans.filter(plan => {
    const matchesSearch = !searchQuery || plan.title.toLowerCase().includes(searchQuery.toLowerCase()) || plan.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || plan.subjectId === filterSubject;
    const matchesGrade = !filterGrade || plan.gradeId === filterGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const groupedPlans = filteredPlans.reduce((acc, plan) => {
    const key = `${plan.subjectId}-${plan.gradeId}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(plan);
    return acc;
  }, {} as Record<string, LessonPlan[]>);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              纵向备课
            </h1>
            <button
              onClick={() => navigate('/lesson-plans/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              新建
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索课题或单元..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterSubject('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !filterSubject
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部学科
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setFilterSubject(subject.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filterSubject === subject.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterGrade('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !filterGrade
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部年级
              </button>
              {GRADES.map((grade, index) => (
                <button
                  key={index + 1}
                  onClick={() => setFilterGrade((index + 1).toString())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filterGrade === (index + 1).toString()
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {Object.keys(groupedPlans).length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有备课方案</h3>
              <p className="text-gray-500 mb-6">点击右上角新建，开始你的第一个备课</p>
              <button
                onClick={() => navigate('/lesson-plans/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                新建备课方案
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPlans).map(([key, plans]) => {
              const firstPlan = plans[0];
              const subject = getSubjectById(firstPlan.subjectId);
              const grade = GRADES[parseInt(firstPlan.gradeId) - 1];
              return (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h2 className="text-sm font-medium text-gray-700">
                      {subject?.name} · {grade}
                    </h2>
                  </div>
                  <div className="divide-y">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="px-4 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{plan.title}</h3>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  plan.status === 'published'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {plan.status === 'published' ? '已发布' : '草稿'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{plan.unit}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {plan.totalDuration}分钟
                              </span>
                              <span>{plan.objectives.length}个目标</span>
                              <span>{plan.steps.length}个步骤</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <button
                              onClick={() => navigate(`/lesson-plans/${plan.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyPlan(plan)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LessonPlanList;
