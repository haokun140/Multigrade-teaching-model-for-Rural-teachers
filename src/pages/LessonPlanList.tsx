import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Clock, Eye, Copy, Trash2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { LessonPlan, Subject } from '../types';
import BottomNav from '../components/BottomNav';
import { ALL_GRADE_LABELS } from '../lib/grades';

interface FilterOption {
  value: string;
  label: string;
}

const FilterPicker: React.FC<{
  visible: boolean;
  title: string;
  options: FilterOption[];
  currentValue: string;
  allLabel?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}> = ({ visible, title, options, currentValue, allLabel = '全部', onSelect, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <button
            onClick={() => { onSelect(''); onClose(); }}
            className={`w-full text-left px-4 py-3.5 rounded-lg text-sm font-medium ${
              !currentValue ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {allLabel}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); onClose(); }}
              className={`w-full text-left px-4 py-3.5 rounded-lg text-sm border-b border-gray-50 ${
                currentValue === opt.value ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const LessonPlanList: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string[]>([]);
  const [filterGrade, setFilterGrade] = useState<string[]>([]);
  const [filterVersion, setFilterVersion] = useState<string>('');
  const [filterVolume, setFilterVolume] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Which filter modal is open
  const [activeFilter, setActiveFilter] = useState<'subject' | 'grade' | 'version' | 'volume' | null>(null);
  // Multi-select modal temp selection (used before confirm)
  const [tempSelection, setTempSelection] = useState<string[]>([]);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [subjectsRes, lessonPlansRes] = await Promise.all([
        api.getSubjects(),
        api.getAllLessonPlans(),
      ]);
      setSubjects(subjectsRes.data || []);
      setLessonPlans(lessonPlansRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  // Compute unique versions and volumes from lesson plans
  const versions = [...new Set(lessonPlans.map(p => p.version).filter((v): v is string => !!v))].sort();
  const volumes = [...new Set(lessonPlans.map(p => p.volume).filter((v): v is string => !!v))].sort();

  // Filter options for pickers
  const subjectOptions: FilterOption[] = subjects.map(s => ({ value: s.id, label: s.name }));
  const gradeOptions: FilterOption[] = ALL_GRADE_LABELS.map((g, i) => ({ value: String(i + 1), label: g }));
  const versionOptions: FilterOption[] = versions.map(v => ({ value: v, label: v }));
  const volumeOptions: FilterOption[] = volumes.map(v => ({ value: v, label: v }));

  const filteredPlans = lessonPlans.filter(plan => {
    const matchesSearch = !searchQuery ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject.length === 0 || filterSubject.includes(plan.subjectId);
    const matchesGrade = filterGrade.length === 0 || filterGrade.includes(plan.gradeId.toString());
    const matchesVersion = !filterVersion || plan.version === filterVersion;
    const matchesVolume = !filterVolume || plan.volume === filterVolume;
    return matchesSearch && matchesSubject && matchesGrade && matchesVersion && matchesVolume;
  });

  const groupedPlans = filteredPlans.reduce((acc, plan) => {
    const key = `${plan.subjectId}-${plan.gradeId}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(plan);
    return acc;
  }, {} as Record<string, LessonPlan[]>);

  const handleCopyPlan = async (plan: LessonPlan) => {
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

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索课题或单元..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTempSelection([...filterSubject]); setActiveFilter('subject'); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                filterSubject.length > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={filterSubject.length > 0 ? 'font-medium' : ''}>
                {filterSubject.length > 0 ? `学科 (${filterSubject.length})` : '全部学科'}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              onClick={() => { setTempSelection([...filterGrade]); setActiveFilter('grade'); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                filterGrade.length > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={filterGrade.length > 0 ? 'font-medium' : ''}>
                {filterGrade.length > 0 ? `年级 (${filterGrade.length})` : '全部年级'}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              onClick={() => setActiveFilter('version')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                filterVersion ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={filterVersion ? 'font-medium' : ''}>
                {filterVersion || '全部版本'}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              onClick={() => setActiveFilter('volume')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                filterVolume ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={filterVolume ? 'font-medium' : ''}>
                {filterVolume || '全部册次'}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Active filter tags */}
          {(filterSubject.length > 0 || filterGrade.length > 0 || filterVersion || filterVolume) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterSubject.map(sid => (
                <span key={sid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  学科: {getSubjectById(sid)?.name}
                  <button onClick={() => setFilterSubject(prev => prev.filter(v => v !== sid))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filterGrade.map(gid => (
                <span key={gid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  年级: {ALL_GRADE_LABELS[parseInt(gid) - 1]}
                  <button onClick={() => setFilterGrade(prev => prev.filter(v => v !== gid))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filterVersion && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  版本: {filterVersion}
                  <button onClick={() => setFilterVersion('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterVolume && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  册次: {filterVolume}
                  <button onClick={() => setFilterVolume('')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
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
              const grade = ALL_GRADE_LABELS[firstPlan.gradeId - 1];
              return (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-700">
                      {subject?.name} · {grade}
                    </h2>
                    <span className="text-xs text-gray-400">{plans.length}个方案</span>
                  </div>
                  <div className="divide-y">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/lesson-plans/${plan.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{plan.title}</h3>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${
                                  plan.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {plan.status === 'completed' ? '已发布' : '草稿'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1 truncate">{plan.unit}</p>
                            {(plan.version || plan.volume) && (
                              <p className="text-xs text-gray-400 mb-2">
                                {[plan.version, plan.volume].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {plan.totalDuration}分钟
                              </span>
                              <span>{plan.objectives.length}个目标</span>
                              <span>{plan.steps.length}个步骤</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/lesson-plans/${plan.id}`); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyPlan(plan); }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
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

      {/* Multi-select filter modal: subject */}
      {activeFilter === 'subject' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setActiveFilter(null)}>
          <div className="bg-white rounded-2xl w-72 pt-5 pb-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900">选择学科</h3>
              <button onClick={() => setActiveFilter(null)} className="p-1 text-gray-400 hover:text-gray-600 -mr-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
              {subjectOptions.map(opt => {
                const isSelected = tempSelection.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTempSelection(prev =>
                        isSelected ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                      );
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setTempSelection([]); }}
                className={`flex-none px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  tempSelection.length > 0
                    ? 'border-gray-200 text-gray-600 hover:border-gray-300'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                disabled={tempSelection.length === 0}
              >
                重置
              </button>
              <button
                onClick={() => { setFilterSubject(tempSelection); setActiveFilter(null); }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-select filter modal: grade */}
      {activeFilter === 'grade' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setActiveFilter(null)}>
          <div className="bg-white rounded-2xl w-72 pt-5 pb-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900">选择年级</h3>
              <button onClick={() => setActiveFilter(null)} className="p-1 text-gray-400 hover:text-gray-600 -mr-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
              {gradeOptions.map(opt => {
                const isSelected = tempSelection.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTempSelection(prev =>
                        isSelected ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                      );
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setTempSelection([]); }}
                className={`flex-none px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  tempSelection.length > 0
                    ? 'border-gray-200 text-gray-600 hover:border-gray-300'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                disabled={tempSelection.length === 0}
              >
                重置
              </button>
              <button
                onClick={() => { setFilterGrade(tempSelection); setActiveFilter(null); }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single-select modals: version, volume */}
      <FilterPicker
        visible={activeFilter === 'version'}
        title="选择版本"
        options={versionOptions}
        currentValue={filterVersion}
        allLabel="全部版本"
        onSelect={setFilterVersion}
        onClose={() => setActiveFilter(null)}
      />
      <FilterPicker
        visible={activeFilter === 'volume'}
        title="选择册次"
        options={volumeOptions}
        currentValue={filterVolume}
        allLabel="全部册次"
        onSelect={setFilterVolume}
        onClose={() => setActiveFilter(null)}
      />

      <BottomNav />
    </div>
  );
};

export default LessonPlanList;
