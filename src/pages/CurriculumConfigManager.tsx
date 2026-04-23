import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { CurriculumConfig, Subject } from '../types';
import BottomNav from '../components/BottomNav';

const CurriculumConfigManager: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [configs, setConfigs] = useState<CurriculumConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CurriculumConfig | null>(null);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const DEFAULT_VERSIONS = ['人教版', '北师大版', '苏教版', '沪教版', '其他'];
  const DEFAULT_VOLUMES = ['上册', '下册', '全一册'];

  const [formData, setFormData] = useState({
    subjectId: '',
    gradeId: '',
    version: '',
    volumes: [] as string[],
  });

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

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
      gradeId: '',
      version: '',
      volumes: [],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (config: CurriculumConfig) => {
    setEditingConfig(config);
    setFormData({
      subjectId: config.subjectId,
      gradeId: config.gradeId.toString(),
      version: config.version,
      volumes: [...config.volumes],
    });
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
    if (!formData.subjectId || !formData.gradeId || !formData.version) {
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
        await api.createCurriculumConfig({
          subjectId: formData.subjectId,
          gradeId: parseInt(formData.gradeId),
          version: formData.version,
          volumes: formData.volumes,
        });
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
            <h1 className="text-lg font-bold text-gray-900">课程配置</h1>
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
        {configs.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-gray-600 mb-4">还没有课程配置</p>
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加配置
            </button>
          </div>
        ) : (
          configs.map(config => {
            const subject = getSubjectById(config.subjectId);
            const grade = GRADES[config.gradeId - 1];
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingConfig ? '编辑配置' : '添加配置'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-6 h-6 rotate-90" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, gradeId: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择年级</option>
                  {GRADES.map((grade, index) => (
                    <option key={index + 1} value={(index + 1).toString()}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">教材版本</label>
                <select
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择版本</option>
                  {DEFAULT_VERSIONS.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">册次</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_VOLUMES.map(volume => {
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
