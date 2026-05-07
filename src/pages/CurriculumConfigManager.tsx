import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { CurriculumConfig, Subject } from '../types';
import BottomNav from '../components/BottomNav';
import { getAvailableGrades, ALL_GRADE_LABELS } from '../lib/grades';

const CurriculumConfigManager: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { school } = useAppStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [configs, setConfigs] = useState<CurriculumConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CurriculumConfig | null>(null);

  // Filter state
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterGradeId, setFilterGradeId] = useState('');
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);
  const [showGradeFilter, setShowGradeFilter] = useState(false);

  const grades = useMemo(() => getAvailableGrades(school?.type), [school?.type]);

  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [availableVolumes, setAvailableVolumes] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);

  const [formData, setFormData] = useState({
    subjectId: '',
    selectedGradeIds: [] as number[],
    version: '',
    volumes: [] as string[],
  });

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  // 学科变更时拉取版本列表
  useEffect(() => {
    if (!formData.subjectId || !showModal) return;
    const subject = getSubjectById(formData.subjectId);
    if (!subject) return;

    setLoadingVersions(true);
    api.getTextbookVersions(subject.name, school?.type)
      .then(res => {
        if (res.success && res.data) setAvailableVersions(res.data);
      })
      .catch(() => setAvailableVersions([]))
      .finally(() => setLoadingVersions(false));
  }, [formData.subjectId, showModal]);

  // 版本变更时拉取册次列表
  useEffect(() => {
    if (!formData.subjectId || !formData.version || !showModal) return;
    const subject = getSubjectById(formData.subjectId);
    if (!subject) return;

    setLoadingVolumes(true);
    api.getTextbookVolumes(subject.name, formData.version, undefined, school?.type)
      .then(res => {
        if (res.success && res.data) setAvailableVolumes(res.data);
      })
      .catch(() => setAvailableVolumes([]))
      .finally(() => setLoadingVolumes(false));
  }, [formData.version, formData.subjectId, showModal]);

  const loadData = async () => {
    try {
      const [subjectsRes, configsRes] = await Promise.all([
        api.getSubjects(),
        api.getCurriculumConfigs(),
      ]);
      setSubjects(subjectsRes.data || []);
      setConfigs(configsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingConfig(null);
    setFormData({
      subjectId: '',
      selectedGradeIds: [],
      version: '',
      volumes: [],
    });
    setAvailableVersions([]);
    setAvailableVolumes([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (config: CurriculumConfig) => {
    setEditingConfig(config);
    setFormData({
      subjectId: config.subjectId,
      selectedGradeIds: [config.gradeId],
      version: config.version,
      volumes: [...config.volumes],
    });
    setAvailableVersions([]);
    setAvailableVolumes([]);
    setShowModal(true);
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      await api.deleteCurriculumConfig(id);
      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleToggleVolume = (volume: string) => {
    setFormData(prev => {
      const isSelected = prev.volumes.includes(volume);
      if (isSelected) {
        return {
          ...prev,
          volumes: prev.volumes.filter(v => v !== volume),
        };
      } else {
        return {
          ...prev,
          volumes: [...prev.volumes, volume],
        };
      }
    });
  };

  const handleSaveConfig = async () => {
    if (!formData.subjectId || formData.selectedGradeIds.length === 0 || !formData.version) {
      alert('请填写完整信息');
      return;
    }

    if (formData.volumes.length === 0) {
      alert('请至少选择一个册次');
      return;
    }

    setSaving(true);
    try {
      if (editingConfig) {
        await api.updateCurriculumConfig(editingConfig.id, {
          version: formData.version,
          volumes: formData.volumes,
        });
      } else {
        // 多年级选择，按年级拆分生成多条教材数据
        for (const gradeId of formData.selectedGradeIds) {
          await api.createCurriculumConfig({
            subjectId: formData.subjectId,
            gradeId,
            version: formData.version,
            volumes: formData.volumes,
          });
        }
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const getSubjectById = (subjectId: string) => subjects.find(s => s.id === subjectId);

  const filteredConfigs = useMemo(() => {
    return configs.filter(c => {
      if (filterSubjectId && c.subjectId !== filterSubjectId) return false;
      if (filterGradeId && c.gradeId !== parseInt(filterGradeId)) return false;
      return true;
    });
  }, [configs, filterSubjectId, filterGradeId]);

  const selectedSubjectName = filterSubjectId ? getSubjectById(filterSubjectId)?.name : '';
  const selectedGradeLabel = filterGradeId ? ALL_GRADE_LABELS[parseInt(filterGradeId) - 1] : '';

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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">教材选择</h1>
            <button
              onClick={handleOpenAddModal}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Filter bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSubjectFilter(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              filterSubjectId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterSubjectId ? selectedSubjectName : '全部学科'}
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGradeFilter(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              filterGradeId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterGradeId ? selectedGradeLabel : '全部年级'}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {filteredConfigs.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-gray-600 mb-4">{configs.length === 0 ? '还没有教材配置' : '未找到匹配的教材'}</p>
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加配置
            </button>
          </div>
        ) : (
          filteredConfigs.map(config => {
            const subject = getSubjectById(config.subjectId);
            const grade = ALL_GRADE_LABELS[config.gradeId - 1];
            return (
              <div key={config.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {subject?.name} · {grade} · {config.version}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      册次：{config.volumes.join('、')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(config)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subject filter modal */}
      {showSubjectFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowSubjectFilter(false)}>
          <div className="bg-white rounded-2xl w-72 pt-5 pb-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900">选择学科</h3>
              <button
                onClick={() => setShowSubjectFilter(false)}
                className="p-1 text-gray-400 hover:text-gray-600 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setFilterSubjectId(''); setShowSubjectFilter(false); }}
                className={`w-full py-3 px-4 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                  !filterSubjectId ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                全部学科
              </button>
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => { setFilterSubjectId(subject.id); setShowSubjectFilter(false); }}
                  className={`w-full py-3 px-4 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                    filterSubjectId === subject.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grade filter modal */}
      {showGradeFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowGradeFilter(false)}>
          <div className="bg-white rounded-2xl w-72 pt-5 pb-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900">选择年级</h3>
              <button
                onClick={() => setShowGradeFilter(false)}
                className="p-1 text-gray-400 hover:text-gray-600 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setFilterGradeId(''); setShowGradeFilter(false); }}
                className={`w-full py-3 px-4 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                  !filterGradeId ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                全部年级
              </button>
              {grades.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setFilterGradeId(id.toString()); setShowGradeFilter(false); }}
                  className={`w-full py-3 px-4 rounded-lg border-2 text-sm font-medium text-left transition-colors ${
                    filterGradeId === id.toString() ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingConfig ? '编辑教材' : '新增教材'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择学科</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">教材版本</label>
                <select
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.subjectId || loadingVersions}
                >
                  <option value="">{loadingVersions ? '加载中...' : '请选择版本'}</option>
                  {availableVersions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年级（可多选）</label>
                <div className="grid grid-cols-3 gap-2">
                  {grades.map(({ id, label }) => {
                    const isSelected = formData.selectedGradeIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedGradeIds: isSelected
                              ? prev.selectedGradeIds.filter(g => g !== id)
                              : [...prev.selectedGradeIds, id],
                          }));
                        }}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">册次</label>
                {loadingVolumes ? (
                  <p className="text-sm text-gray-400 py-2">加载中...</p>
                ) : availableVolumes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">{formData.version ? '该版本暂无册次数据' : '请先选择版本'}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableVolumes.map(volume => {
                      const isSelected = formData.volumes.includes(volume);
                      return (
                        <button
                          key={volume}
                          type="button"
                          onClick={() => handleToggleVolume(volume)}
                          className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {volume}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CurriculumConfigManager;
