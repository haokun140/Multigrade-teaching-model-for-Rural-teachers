import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, Clock, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { LessonPlan, LessonStep, Subject, Class as ClassType, CurriculumConfig } from '../types';

const LessonPlanEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [curriculumConfigs, setCurriculumConfigs] = useState<CurriculumConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  interface PlanFormState {
    schoolId: string;
    classId: string | null;
    subjectId: string;
    gradeId: number;
    unit: string;
    title: string;
    volume: string;
    curriculumVersion: string;
    objectives: string[];
    steps: Array<{
      name: string;
      detail: string;
      type: 'dynamic' | 'static';
      duration: number;
      materials: string;
      hasAssistant: boolean;
      sortOrder: number;
    }>;
    totalDuration: number;
    status: 'draft' | 'completed';
    timetableId: string | null;
  }

  const [plan, setPlan] = useState<PlanFormState>({
    schoolId: '',
    classId: '',
    subjectId: '',
    gradeId: 0,
    unit: '',
    title: '',
    volume: '',
    curriculumVersion: '',
    objectives: [''],
    steps: [{ name: '', detail: '', type: 'dynamic', duration: 10, materials: '', hasAssistant: false, sortOrder: 0 }],
    totalDuration: 0,
    status: 'draft',
    timetableId: null,
  });

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token, id]);

  useEffect(() => {
    // 当学科和年级都选择时，加载对应的课程配置
    if (plan.subjectId && plan.gradeId) {
      loadCurriculumConfigs(plan.subjectId, plan.gradeId);
    } else {
      setCurriculumConfigs([]);
    }
  }, [plan.subjectId, plan.gradeId]);

  const loadCurriculumConfigs = async (subjectId: string, gradeId: number) => {
    try {
      const configsRes = await api.getCurriculumConfigs(subjectId, gradeId);
      const configs = configsRes.data || [];
      setCurriculumConfigs(configs);

      // Smart defaults: auto-select version and volume
      if (configs.length > 0 && !id) {
        const versions = [...new Set(configs.map(c => c.version))];
        const latestVersion = versions[versions.length - 1];
        setPlan(prev => {
          const next = { ...prev };
          if (!prev.curriculumVersion) {
            next.curriculumVersion = latestVersion;
          }
          if (next.curriculumVersion) {
            const currentConfig = configs.find(c => c.version === next.curriculumVersion);
            if (currentConfig && currentConfig.volumes.length > 0 && !prev.volume) {
              next.volume = currentConfig.volumes[currentConfig.volumes.length - 1];
            }
          }
          return next;
        });
      }
    } catch (error) {
      console.error('加载课程配置失败:', error);
    }
  };

  const loadData = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        api.getSubjects(),
        api.getClasses(),
      ]);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);

      if (id && id !== 'new') {
        const planRes = await api.getLessonPlan(id);
        if (planRes.data) {
          setPlan({
            schoolId: planRes.data.schoolId,
            classId: planRes.data.classId,
            subjectId: planRes.data.subjectId,
            gradeId: planRes.data.gradeId,
            unit: planRes.data.unit,
            title: planRes.data.title,
            volume: planRes.data.volume || '',
            curriculumVersion: planRes.data.version || '',
            objectives: planRes.data.objectives.map(o => o.content),
            steps: planRes.data.steps.map(s => ({
              name: s.name,
              detail: s.detail,
              type: s.type,
              duration: s.duration,
              materials: s.materials,
              hasAssistant: s.hasAssistant,
              sortOrder: s.sortOrder,
            })),
            totalDuration: planRes.data.totalDuration,
            status: planRes.data.status,
            timetableId: planRes.data.timetableId,
          });
          setIsViewMode(true);
        }
      }

      setPlan(prev => ({ ...prev, schoolId: user!.schoolId }));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = () => {
    return plan.steps.reduce((sum, step) => sum + step.duration, 0);
  };

  const handleAddObjective = () => {
    setPlan(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  };

  const handleUpdateObjective = (index: number, value: string) => {
    const newObjectives = [...plan.objectives];
    newObjectives[index] = value;
    setPlan(prev => ({ ...prev, objectives: newObjectives }));
  };

  const handleRemoveObjective = (index: number) => {
    if (plan.objectives.length <= 1) return;
    setPlan(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const handleAddStep = () => {
    const newStep = {
      name: '',
      detail: '',
      type: 'dynamic' as const,
      duration: 10,
      materials: '',
      hasAssistant: false,
      sortOrder: plan.steps.length,
    };
    setPlan(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const handleUpdateStep = (index: number, updates: Partial<LessonStep>) => {
    const newSteps = [...plan.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setPlan(prev => ({ ...prev, steps: newSteps }));
  };

  const handleRemoveStep = (index: number) => {
    if (plan.steps.length <= 1) return;
    const newSteps = plan.steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      sortOrder: i,
    }));
    setPlan(prev => ({ ...prev, steps: newSteps }));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!plan.title.trim() || !plan.subjectId || !plan.gradeId) {
      alert('请填写完整信息');
      return;
    }

    setSaving(true);
    try {
      const totalDuration = calculateTotalDuration();
      const objectives = plan.objectives
        .filter(o => o.trim() !== '')
        .map((content, idx) => ({
          id: `obj-${Date.now()}-${idx}`,
          content,
          sortOrder: idx,
        }));
      const steps = plan.steps
        .map((step, index) => ({
          id: `step-${Date.now()}-${index}`,
          planId: '',
          ...step,
          sortOrder: index,
        }))
        .filter(step => step.name.trim() !== '');

      if (id && id !== 'new') {
        await api.updateLessonPlan(id, {
          unit: plan.unit,
          title: plan.title,
          version: plan.curriculumVersion || undefined,
          volume: plan.volume || undefined,
          objectives,
          steps,
          totalDuration,
          status: publish ? 'completed' : 'draft',
        });
      } else {
        await api.createLessonPlan({
          subjectId: plan.subjectId,
          gradeId: plan.gradeId,
          unit: plan.unit,
          title: plan.title,
          version: plan.curriculumVersion || undefined,
          volume: plan.volume || undefined,
          objectives,
          steps,
          totalDuration,
          status: publish ? 'completed' : 'draft',
        });
      }

      navigate('/lesson-plans');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/lesson-plans')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {isViewMode ? '查看备课方案' : id && id !== 'new' ? '编辑备课方案' : '新建备课方案'}
            </h1>
            {isViewMode ? (
              plan.status === 'draft' ? (
                <button
                  onClick={() => {
                    if (confirm('确定发布此备课方案吗？')) {
                      handleSave(true);
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  发布
                </button>
              ) : (
                <button
                  onClick={() => setIsViewMode(false)}
                  className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg"
                >
                  编辑
                </button>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  保存草稿
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  发布
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
              <div
                onClick={() => !isViewMode && setShowSubjectModal(true)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between ${
                  isViewMode ? 'bg-gray-50 cursor-default' : 'cursor-pointer hover:border-gray-300'
                }`}
              >
                <span className={plan.subjectId ? 'text-gray-900' : 'text-gray-400'}>
                  {plan.subjectId ? (subjects.find(s => s.id === plan.subjectId)?.name || '请选择学科') : '请选择学科'}
                </span>
                {!isViewMode && <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
              <div
                onClick={() => !isViewMode && setShowGradeModal(true)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between ${
                  isViewMode ? 'bg-gray-50 cursor-default' : 'cursor-pointer hover:border-gray-300'
                }`}
              >
                <span className={plan.gradeId ? 'text-gray-900' : 'text-gray-400'}>
                  {plan.gradeId ? GRADES[plan.gradeId - 1] : '请选择年级'}
                </span>
                {!isViewMode && <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {curriculumConfigs.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">版本</label>
                <div
                  onClick={() => !isViewMode && setShowVersionModal(true)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between ${
                    isViewMode ? 'bg-gray-50 cursor-default' : 'cursor-pointer hover:border-gray-300'
                  }`}
                >
                  <span className={plan.curriculumVersion ? 'text-gray-900' : 'text-gray-400'}>
                    {plan.curriculumVersion || '请选择版本'}
                  </span>
                  {!isViewMode && <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
                {plan.curriculumVersion && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">册次</label>
                    <div
                      onClick={() => !isViewMode && setShowVolumeModal(true)}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between ${
                        isViewMode ? 'bg-gray-50 cursor-default' : 'cursor-pointer hover:border-gray-300'
                      }`}
                    >
                      <span className={plan.volume ? 'text-gray-900' : 'text-gray-400'}>
                        {plan.volume || '请选择册次'}
                      </span>
                      {!isViewMode && <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单元/课时</label>
              <input
                type="text"
                value={plan.unit}
                onChange={(e) => setPlan(prev => ({ ...prev, unit: e.target.value }))}
                disabled={isViewMode}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="例如：第三单元 第1课时"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课题</label>
              <input
                type="text"
                value={plan.title}
                onChange={(e) => setPlan(prev => ({ ...prev, title: e.target.value }))}
                disabled={isViewMode}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="本节课的教学主题"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">教学目标</h2>
            {!isViewMode && (
              <button
                onClick={handleAddObjective}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            )}
          </div>
          <div className="space-y-3">
            {plan.objectives.map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-2">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <textarea
                    value={objective}
                    onChange={(e) => handleUpdateObjective(index, e.target.value)}
                    disabled={isViewMode}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none"
                    placeholder="请输入教学目标..."
                  />
                </div>
                {!isViewMode && plan.objectives.length > 1 && (
                  <button
                    onClick={() => handleRemoveObjective(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0 mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">教学步骤</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                总计 {calculateTotalDuration()}分钟
              </div>
              {!isViewMode && (
                <button
                  onClick={handleAddStep}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {plan.steps.map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  step.type === 'dynamic' ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    step.type === 'dynamic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {step.type === 'dynamic' ? '动' : '静'}
                  </span>
                  {!isViewMode && (
                    <button
                      onClick={() => handleRemoveStep(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-auto"
                      disabled={plan.steps.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) => handleUpdateStep(index, { name: e.target.value })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 font-medium"
                    placeholder="步骤名称"
                  />

                  <textarea
                    value={step.detail}
                    onChange={(e) => handleUpdateStep(index, { detail: e.target.value })}
                    disabled={isViewMode}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none"
                    placeholder="详细的教学内容描述..."
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">预计时长（分钟）</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={step.duration}
                        onChange={(e) => handleUpdateStep(index, { duration: parseInt(e.target.value) || 1 })}
                        disabled={isViewMode}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>

                    {!isViewMode && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">动/静属性</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStep(index, { type: 'dynamic' })}
                            disabled={isViewMode}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              step.type === 'dynamic'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            动
                          </button>
                          <button
                            onClick={() => handleUpdateStep(index, { type: 'static' })}
                            disabled={isViewMode}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              step.type === 'static'
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            静
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={step.materials}
                    onChange={(e) => handleUpdateStep(index, { materials: e.target.value })}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                    placeholder="所需教具/资源..."
                  />

                  {!isViewMode && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={step.hasAssistant}
                        onChange={(e) => handleUpdateStep(index, { hasAssistant: e.target.checked })}
                        disabled={isViewMode}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">需要学生小助教协助</span>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowSubjectModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">选择学科</h3>
              <button onClick={() => setShowSubjectModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setPlan(prev => ({ ...prev, subjectId: s.id, curriculumVersion: '', volume: '' }));
                    setShowSubjectModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    plan.subjectId === s.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-900'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowGradeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">选择年级</h3>
              <button onClick={() => setShowGradeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {GRADES.map((g, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPlan(prev => ({ ...prev, gradeId: i + 1, curriculumVersion: '', volume: '' }));
                    setShowGradeModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    plan.gradeId === i + 1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowVersionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">选择版本</h3>
              <button onClick={() => setShowVersionModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[...new Set(curriculumConfigs.map(c => c.version))].map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setPlan(prev => ({ ...prev, curriculumVersion: v, volume: '' }));
                    setShowVersionModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    plan.curriculumVersion === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Volume Modal */}
      {showVolumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowVolumeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">选择册次</h3>
              <button onClick={() => setShowVolumeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(curriculumConfigs.find(c => c.version === plan.curriculumVersion)?.volumes || []).map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setPlan(prev => ({ ...prev, volume: v }));
                    setShowVolumeModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    plan.volume === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanEdit;
