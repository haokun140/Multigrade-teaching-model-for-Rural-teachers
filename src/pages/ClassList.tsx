import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit, Trash2, X, Calendar, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { Class as ClassType } from '../types';
import BottomNav from '../components/BottomNav';
import { getAvailableGrades, ALL_GRADE_LABELS } from '../lib/grades';

const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { school } = useAppStore();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'single' as 'single' | 'composite',
    gradeIds: [] as number[],
  });

  // Search & filter state
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'composite'>('all');
  const [filterGrades, setFilterGrades] = useState<number[]>([]);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showGradeFilter, setShowGradeFilter] = useState(false);

  const grades = useMemo(() => getAvailableGrades(school?.type), [school?.type]);

  useEffect(() => {
    if (user && token) {
      loadClasses();
    }
  }, [user, token]);

  const loadClasses = async () => {
    try {
      const res = await api.getClasses();
      setClasses(res.data || []);
    } catch (error) {
      console.error('加载班级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setForm({ name: '', type: 'single', gradeIds: [] });
    setShowModal(true);
  };

  const openEditModal = (cls: ClassType) => {
    setEditingClass(cls);
    setForm({
      name: cls.name,
      type: cls.type,
      gradeIds: [...cls.gradeIds],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.gradeIds.length === 0) return;
    if (form.type === 'composite' && form.gradeIds.length < 2) {
      alert('复式班至少选择2个年级');
      return;
    }
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          ...form,
          schoolId: user!.schoolId,
        });
      } else {
        await api.createClass({
          ...form,
          schoolId: user!.schoolId,
        });
      }
      setShowModal(false);
      loadClasses();
    } catch (error) {
      console.error('保存班级失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个班级吗？')) return;
    try {
      await api.deleteClass(id);
      loadClasses();
    } catch (error) {
      console.error('删除班级失败:', error);
    }
  };

  // Filter logic
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Name search
      if (searchText && !cls.name.includes(searchText)) return false;
      // Type filter
      if (filterType !== 'all' && cls.type !== filterType) return false;
      // Grade filter
      if (filterGrades.length > 0 && !filterGrades.some(g => cls.gradeIds.includes(g))) return false;
      return true;
    });
  }, [classes, searchText, filterType, filterGrades]);

  const toggleFilterGrade = (gradeId: number) => {
    setFilterGrades(prev =>
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              班级管理
            </h1>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              创建班级
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Search & Filter */}
        <div className="mb-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索班级名称..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter dropdown triggers */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowTypeFilter(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                filterType !== 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' ? '全部类型' : filterType === 'single' ? '单式班' : '复式班'}
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGradeFilter(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                filterGrades.length > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              年级{filterGrades.length > 0 && ` (${filterGrades.length})`}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {classes.length === 0 ? '还没有班级' : '未找到匹配的班级'}
              </h3>
              <p className="text-gray-500 mb-6">
                {classes.length === 0 ? '点击上方按钮创建您的第一个班级' : '尝试调整筛选条件'}
              </p>
              {classes.length === 0 && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  创建班级
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {cls.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{cls.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {cls.type === 'composite' ? '复式班' : '单式班'}
                        {cls.gradeIds.length > 0 && ` · ${cls.gradeIds.map(gid => ALL_GRADE_LABELS[gid - 1] || `年级${gid}`).join('、')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/timetable?classId=${cls.id}`)}
                      className="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      课表
                    </button>
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Type filter modal */}
      {showTypeFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowTypeFilter(false)}>
          <div className="bg-white rounded-2xl w-72 pt-5 pb-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-gray-900">班级类型</h3>
              <button
                onClick={() => setShowTypeFilter(false)}
                className="p-1 text-gray-400 hover:text-gray-600 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(['all', 'single', 'composite'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setFilterType(t);
                    setShowTypeFilter(false);
                  }}
                  className={`w-full py-3 px-4 rounded-lg border-2 font-medium text-sm transition-colors ${
                    filterType === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t === 'all' ? '全部' : t === 'single' ? '单式班' : '复式班'}
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
            <div className="grid grid-cols-2 gap-2 mb-4">
              {grades.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleFilterGrade(id)}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    filterGrades.includes(id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterGrades([])}
                className={`flex-none px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  filterGrades.length > 0
                    ? 'border-gray-200 text-gray-600 hover:border-gray-300'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                disabled={filterGrades.length === 0}
              >
                重置
              </button>
              <button
                onClick={() => setShowGradeFilter(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingClass ? '编辑班级' : '创建班级'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">班级名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：一年级一班"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">班级类型</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm({
                      ...form,
                      type: 'single',
                      gradeIds: form.gradeIds.length > 1 ? [form.gradeIds[0]] : form.gradeIds
                    })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      form.type === 'single'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    单式班
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: 'composite' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      form.type === 'composite'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    复式班
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">包含年级</label>
                {form.type === 'single' && (
                  <p className="text-xs text-gray-500 mb-2">单式班仅可选择1个年级</p>
                )}
                {form.type === 'composite' && (
                  <p className="text-xs text-orange-500 mb-2">复式班至少选择2个年级</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {grades.map(({ id, label }) => {
                    const isSelected = form.gradeIds.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          if (form.type === 'single') {
                            setForm({ ...form, gradeIds: [id] });
                          } else {
                            if (isSelected) {
                              setForm({ ...form, gradeIds: form.gradeIds.filter(gid => gid !== id) });
                            } else {
                              setForm({ ...form, gradeIds: [...form.gradeIds, id] });
                            }
                          }
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

              <button
                onClick={handleSave}
                disabled={!form.name.trim() || form.gradeIds.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingClass ? '保存修改' : '创建班级'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClassList;