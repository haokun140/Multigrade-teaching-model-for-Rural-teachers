import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { CreateClassRequest } from '../types';

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleGradeToggle = (gradeId: string) => {
    setFormData(prev => ({
      ...prev,
      gradeIds: prev.gradeIds.includes(gradeId)
        ? prev.gradeIds.filter(id => id !== gradeId)
        : [...prev.gradeIds, gradeId]
    }));
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
                onClick={() => setFormData(prev => ({ ...prev, type: 'single' }))}
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
                onClick={() => setFormData(prev => ({ ...prev, type: 'composite' }))}
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
            <div className="grid grid-cols-2 gap-2">
              {GRADES.map((grade, index) => {
                const gradeId = (index + 1).toString();
                const isSelected = formData.gradeIds.includes(gradeId);
                return (
                  <button
                    key={gradeId}
                    type="button"
                    onClick={() => handleGradeToggle(gradeId)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {grade}
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
