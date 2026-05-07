import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { CreateClassRequest } from '../types';
import { getAvailableGrades } from '../lib/grades';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { school } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grades = useMemo(() => getAvailableGrades(school?.type), [school?.type]);

  const [formData, setFormData] = useState<CreateClassRequest>({
    schoolId: user?.schoolId || '',
    name: '',
    type: 'single',
    gradeIds: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('请输入班级名称');
      return;
    }

    if (formData.gradeIds.length === 0) {
      setError('请至少选择一个年级');
      return;
    }

    if (formData.type === 'composite' && formData.gradeIds.length < 2) {
      setError('复式班至少选择2个年级');
      return;
    }

    setLoading(true);
    try {
      const response = await api.createClass(formData);
      if (response.success) {
        navigate('/settings');
      } else {
        setError(response.error || '创建失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSelect = (gradeId: number) => {
    setFormData(prev => {
      if (prev.type === 'single') {
        // 单式班：单选
        return { ...prev, gradeIds: [gradeId] };
      }
      // 复式班：多选
      const isSelected = prev.gradeIds.includes(gradeId);
      return {
        ...prev,
        gradeIds: isSelected
          ? prev.gradeIds.filter(id => id !== gradeId)
          : [...prev.gradeIds, gradeId]
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">创建班级</h1>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              班级名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：一年级一班"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              班级类型
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  type: 'single',
                  gradeIds: prev.gradeIds.length > 1 ? [prev.gradeIds[0]] : prev.gradeIds
                }))}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.type === 'single'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                单式班
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  type: 'composite'
                }))}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.type === 'composite'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                复式班
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              包含年级
            </label>
            {formData.type === 'single' && (
              <p className="text-xs text-gray-500 mb-2">单式班仅可选择1个年级</p>
            )}
            {formData.type === 'composite' && (
              <p className="text-xs text-orange-500 mb-2">复式班至少选择2个年级</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {grades.map(({ id, label }) => {
                const isSelected = formData.gradeIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleGradeSelect(id)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建班级'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClass;
