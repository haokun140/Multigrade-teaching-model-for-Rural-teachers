import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Eye, FileEdit, Clock, Calendar, Users, BookOpen, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Subject, LessonStep } from '../types';
import BottomNav from '../components/BottomNav';
import { ALL_GRADE_LABELS } from '../lib/grades';

interface Track {
  gradeId: number;
  gradeName: string;
  subjectId: string;
  subjectName?: string;
  version: string;
  versions: string[];
  volumes: string[];
  volume: string;
  units: string[];
  lessonPlans?: any[];
}

interface TeachingStep {
  id: string;
  type: 'dynamic-static' | 'cross-grade';
  duration: number;
  gradeSteps: Array<{
    gradeId: number;
    selectedStepIds: string[];
    selectedSteps: LessonStep[];
    blackboard?: string;
  }>;
  crossGradeStep: {
    gradeSubjects: Array<{ gradeId: number; subjectId: string; version: string; volume: string }>;
    name: string;
    content: string;
    materials: string;
    hasAssistant: boolean;
    blackboard?: string;
  };
}

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateFromDayOfWeek(dayOfWeek: number): string {
  const monday = getMondayOfWeek(new Date());
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayOfWeek - 1);
  return `${date.getMonth() + 1}月${date.getDate()}日（${DAY_NAMES[dayOfWeek - 1]}）`;
}

function parseTimeFromPeriodInfo(periodInfo: string | null): { timeRange: string; periodName: string } | null {
  if (!periodInfo) return null;
  const match = periodInfo.match(/^(第\d+节)\s+(.+)$/);
  if (match) {
    return { periodName: match[1], timeRange: match[2] };
  }
  return { periodName: '', timeRange: periodInfo };
}

const HorizontalPlanView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [teachingSteps, setTeachingSteps] = useState<TeachingStep[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(45);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [homework, setHomework] = useState<Array<{ gradeId: number; content: string }>>([]);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  useEffect(() => {
    const tid = searchParams.get('timetableId');
    if (tid) {
      setTimetableId(tid);
      loadPlanData(tid);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const loadPlanData = async (tid: string) => {
    try {
      const planRes = await api.getHorizontalPlanByTimetable(tid);
      if (planRes.data) {
        const plan = planRes.data;
        setExistingPlanId(plan.id);
        setSelectedClass(plan.classId);
        setLessonDuration(plan.lessonDuration || 45);

        const date = searchParams.get('date');
        const time = searchParams.get('time');
        const dowStr = searchParams.get('dayOfWeek');
        if (date) setSelectedDate(date);
        if (time) setSelectedTime(decodeURIComponent(time));
        if (dowStr) setDayOfWeek(parseInt(dowStr));

        if (plan.tracks && plan.tracks.length > 0) {
          const restoredTracks: Track[] = plan.tracks.map((t: any) => ({
            gradeId: t.gradeId,
            gradeName: t.gradeName || ALL_GRADE_LABELS[t.gradeId - 1],
            subjectId: t.subjectId,
            subjectName: t.subjectName || '',
            version: t.version || '',
            versions: t.versions || [],
            volumes: t.volumes || [],
            volume: t.volume || '',
            units: t.units || [],
            lessonPlans: t.lessonPlans,
          }));
          setTracks(restoredTracks);
        }

        if (plan.interactions && plan.interactions.length > 0) {
          const restoredSteps: TeachingStep[] = plan.interactions.map((interaction: any, index: number) => ({
            id: `step-${index}`,
            type: (interaction.stepType || 'cross-grade') as 'dynamic-static' | 'cross-grade',
            duration: interaction.duration || 15,
            gradeSteps: (interaction.gradeSteps || []).map((gs: any) => ({
              gradeId: gs.gradeId,
              selectedStepIds: gs.selectedStepIds || [],
              selectedSteps: gs.selectedSteps || [],
              blackboard: gs.blackboard || '',
            })),
            crossGradeStep: {
              gradeSubjects: interaction.gradeSubjects || [],
              name: interaction.name || '',
              content: interaction.content || '',
              materials: interaction.materials || '',
              hasAssistant: interaction.hasAssistant || false,
              blackboard: interaction.blackboard || '',
            },
          }));
          setTeachingSteps(restoredSteps);
        }

        if (plan.homework && Array.isArray(plan.homework)) {
          setHomework(plan.homework);
        }
      }
    } catch (e) {
      console.error('加载横向备课失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandAll = () => {
    if (expandedSteps.size === teachingSteps.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(teachingSteps.map(s => s.id)));
    }
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getClassInfo = () => classes.find(c => c.id === selectedClass);
  const getSubjectById = (subjectId: string) => subjects.find(s => s.id === subjectId);

  const handleEdit = () => {
    const params = new URLSearchParams();
    if (timetableId) params.set('timetableId', timetableId);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTime) params.set('time', selectedTime);
    if (dayOfWeek) params.set('dayOfWeek', String(dayOfWeek));
    params.set('period', searchParams.get('period') || '1');
    navigate(`/horizontal-plans/edit?${params.toString()}`);
  };

  const handlePreview = () => {
    const params = new URLSearchParams();
    if (timetableId) params.set('timetableId', timetableId);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedTime) params.set('time', selectedTime);
    if (dayOfWeek) params.set('dayOfWeek', String(dayOfWeek));
    params.set('duration', String(lessonDuration));
    navigate(`/horizontal-plans/preview?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-36">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const cls = getClassInfo();

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/timetable')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">横向备课</h1>
            <button
              onClick={handleEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <FileEdit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">班级</label>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <Users className="w-4 h-4 text-blue-600" />
                {cls?.name} {cls?.type === 'composite' ? '(复式班)' : ''}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">日期</label>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                {selectedDate || (dayOfWeek ? formatDateFromDayOfWeek(dayOfWeek) : '-')}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">时间</label>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-blue-600" />
                {(() => {
                  const parsed = parseTimeFromPeriodInfo(selectedTime || null);
                  if (parsed) return `${parsed.timeRange}（${parsed.periodName}）`;
                  return selectedTime || '-';
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">年级学科配置</h3>
          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.gradeId} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{track.subjectName || '-'}</span>
                  <span className="text-xs text-gray-500">{track.version || '-'}</span>
                  <span className="text-xs text-gray-500">{track.volume || '-'}</span>
                </div>
                {track.units.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {track.units.map(unit => (
                      <span key={unit} className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                        {unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-700">教学步骤</h3>
              {teachingSteps.length > 0 && (
                <button
                  onClick={toggleExpandAll}
                  className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                >
                  {expandedSteps.size === teachingSteps.length ? '收起全部' : '展开全部'}
                </button>
              )}
            </div>
          </div>

          {teachingSteps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">暂无教学步骤</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teachingSteps.map((step, stepIndex) => {
                const isExpanded = expandedSteps.has(step.id);
                return (
                  <div
                    key={step.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleStepExpanded(step.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {stepIndex + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          step.type === 'dynamic-static'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {step.type === 'dynamic-static' ? '动+静' : '跨年级互动'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.duration}分钟
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        {step.type === 'dynamic-static' && (
                          <div className="space-y-2 mt-3">
                            {tracks.map((track) => {
                              const gradeStep = step.gradeSteps.find(gs => gs.gradeId === track.gradeId);
                              const selectedSteps = gradeStep?.selectedSteps || [];
                              return (
                                <div key={track.gradeId} className="border border-gray-100 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                                    <span className="text-xs text-gray-500">{track.subjectName}</span>
                                  </div>
                                  {selectedSteps.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">未选择步骤</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {selectedSteps.map(s => (
                                        <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                                          <div className="flex items-center gap-1 mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                              s.type === 'dynamic'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}>
                                              {s.type === 'dynamic' ? '动' : '静'}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                                          </div>
                                          <p className="text-xs text-gray-600">{s.detail}</p>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-400">{s.duration}分钟</span>
                                            {s.materials && <span className="text-xs text-gray-400">教具: {s.materials}</span>}
                                            {s.hasAssistant && (
                                              <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                                                <CheckCircle className="w-3 h-3" />
                                                需小助手
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {gradeStep?.blackboard && (
                                    <div className="mt-2 text-xs text-gray-600 bg-orange-50 border border-orange-100 rounded p-2">
                                      <span className="font-medium">板书：</span>{gradeStep.blackboard}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {step.type === 'cross-grade' && (
                          <div className="space-y-2 mt-3 text-sm">
                            <div><span className="text-gray-500">名称：</span><span className="text-gray-900">{step.crossGradeStep.name || '未填写'}</span></div>
                            <div><span className="text-gray-500">内容：</span><span className="text-gray-900">{step.crossGradeStep.content || '未填写'}</span></div>
                            <div><span className="text-gray-500">教具：</span><span className="text-gray-900">{step.crossGradeStep.materials || '未填写'}</span></div>
                            {step.crossGradeStep.hasAssistant && (
                              <div className="text-yellow-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                需要学生小助教协助
                              </div>
                            )}
                            {step.crossGradeStep.blackboard && (
                              <div className="text-xs text-gray-600 bg-orange-50 border border-orange-100 rounded p-2">
                                <span className="font-medium">板书：</span>{step.crossGradeStep.blackboard}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {tracks.length > 0 && homework.some(h => h.content) && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">作业布置</h3>
            <div className="space-y-2">
              {tracks.map(track => {
                const hw = homework.find(h => h.gradeId === track.gradeId);
                if (!hw?.content) return null;
                const lines = hw.content.split('\n').filter(l => l.trim());
                return (
                  <div key={track.gradeId} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                      <span className="text-xs text-gray-500">{track.subjectName}</span>
                    </div>
                    <div className="space-y-1">
                      {lines.map((line, i) => (
                        <p key={i} className="text-sm text-gray-700">{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
        <button
          onClick={handlePreview}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <Eye className="w-5 h-5" />
          教案预览
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default HorizontalPlanView;
