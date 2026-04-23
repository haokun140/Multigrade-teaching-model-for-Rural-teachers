import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Download, Clock, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { LessonPlan, Subject } from '../types';
import BottomNav from '../components/BottomNav';

const LessonCard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  useEffect(() => {
    if (user && token && id) {
      loadData();
    }
  }, [user, token, id]);

  const loadData = async () => {
    try {
      const [planRes, subjectsRes] = await Promise.all([
        api.getLessonPlan(id!),
        api.getSubjects(),
      ]);
      setLessonPlan(planRes.data);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (subjectId: string) => subjects.find(s => s.id === subjectId);

  const handleShare = async () => {
    alert('分享功能开发中...');
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

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未找到备课方案</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const subject = getSubjectById(lessonPlan.subjectId);
  const grade = GRADES[parseInt(lessonPlan.gradeId) - 1];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/lesson-plans')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">课程卡片</h1>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm opacity-80">{subject?.name} · {grade}{lessonPlan.volume ? ` · ${lessonPlan.volume}` : ''}</span>
                <span className="flex items-center gap-1 text-sm opacity-80">
                  <Clock className="w-4 h-4" />
                  {lessonPlan.totalDuration}分钟
                </span>
              </div>
              <h2 className="text-2xl font-bold">{lessonPlan.title}</h2>
              {lessonPlan.unit && (
                <p className="text-sm opacity-80 mt-1">{lessonPlan.unit}</p>
              )}
            </div>

          <div className="p-6">
            {lessonPlan.objectives.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">教学目标</h3>
                <ul className="space-y-2">
                  {lessonPlan.objectives.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700">{objective}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lessonPlan.steps.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">教学流程</h3>
                
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <div className="absolute inset-0 flex">
                    {lessonPlan.steps.map((step, idx) => {
                      const totalDuration = lessonPlan.totalDuration || 45;
                      const widthPercent = (step.duration / totalDuration) * 100;
                      return (
                        <div
                          key={idx}
                          className={`h-full ${
                            step.type === 'dynamic' ? 'bg-blue-500' : 'bg-gray-400'
                          } flex items-center justify-center text-white text-xs px-1`}
                          style={{ width: `${widthPercent}%` }}
                        >
                          {step.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {lessonPlan.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        step.type === 'dynamic'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-400 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            step.type === 'dynamic' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          <span className="font-bold text-gray-900">
                            {idx + 1}. {step.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {step.duration}分钟
                        </span>
                      </div>
                      {step.detail && (
                        <p className="text-sm text-gray-600 mb-2">{step.detail}</p>
                      )}
                      {step.materials && (
                        <p className="text-sm text-gray-500">教具：{step.materials}</p>
                      )}
                      {step.hasAssistant && (
                        <p className="text-sm text-yellow-600 mt-1">需要学生小助教协助</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LessonCard;
