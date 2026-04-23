import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Users, School, Plus, Edit, Trash2, LogOut, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, School as SchoolType } from '../types';
import BottomNav from '../components/BottomNav';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    type: 'single' as 'single' | 'composite',
    gradeIds: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [schoolRes, classesRes] = await Promise.all([
        api.getSchool(),
        api.getClasses(),
      ]);
      setSchool(schoolRes?.data || null);
      setClasses(classesRes?.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setSchool(null);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClass = async () => {
    if (!newClass.name.trim()) return;

    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          ...newClass,
          schoolId: user!.schoolId,
        });
      } else {
        await api.createClass({
          ...newClass,
          schoolId: user!.schoolId,
        });
      }
      setShowClassModal(false);
      setEditingClass(null);
      setNewClass({ name: '', type: 'single', gradeIds: [] });
      loadData();
    } catch (error) {
      console.error('保存班级失败:', error);
    }
  };

  const handleEditClass = (cls: ClassType) => {
    setEditingClass(cls);
    setNewClass({
      name: cls.name,
      type: cls.type,
      gradeIds: cls.gradeIds,
    });
    setShowClassModal(true);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('确定要删除这个班级吗？')) return;
    try {
      await api.deleteClass(id);
      loadData();
    } catch (error) {
      console.error('删除班级失败:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            设置
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              个人信息
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">姓名</span>
              <span className="text-gray-900">{user?.name}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">手机号</span>
              <span className="text-gray-900">{user?.phone ? `${user.phone.substring(0, 3)}****${user.phone.substring(7)}` : ''}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <School className="w-4 h-4" />
              学校信息
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">学校名称</span>
              <span className="text-gray-900">{school?.name || '未设置'}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">所在地区</span>
              <span className="text-gray-900">{school?.region || '未设置'}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">学校类型</span>
              <span className="text-gray-900">
                {school?.type === 'primary' ? '完全小学' : school?.type === 'middle' ? '初级中学' : school?.type === 'nine-year' ? '九年一贯制' : '未设置'}
              </span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600">邀请码</span>
              <span className="font-mono text-blue-600">{school?.inviteCode}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              班级管理
            </h2>
            <button
              onClick={() => navigate('/create-class')}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="divide-y">
            {classes.map((cls) => (
              <div key={cls.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-medium">{cls.name}</div>
                  <div className="text-xs text-gray-500">
                    {cls.type === 'composite' ? '复式班' : '单式班'}
                    {cls.gradeIds.length > 0 && ` · ${cls.gradeIds.map(id => GRADES[parseInt(id) - 1]).join('、')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClass(cls)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                还没有班级，点击右上角 + 添加
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div 
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => navigate('/curriculum-config')}
          >
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              课程配置
            </h2>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl shadow-sm py-4 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>

      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingClass ? '编辑班级' : '创建班级'}
              </h3>
              <button
                onClick={() => setShowClassModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="w-6 h-6 rotate-90" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  班级名称
                </label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：一年级一班"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  班级类型
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewClass({ ...newClass, type: 'single' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      newClass.type === 'single'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    单式班
                  </button>
                  <button
                    onClick={() => setNewClass({ ...newClass, type: 'composite' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      newClass.type === 'composite'
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
                    const isSelected = newClass.gradeIds.includes(gradeId);
                    return (
                      <button
                        key={gradeId}
                        onClick={() => {
                          if (isSelected) {
                            setNewClass({
                              ...newClass,
                              gradeIds: newClass.gradeIds.filter(id => id !== gradeId),
                            });
                          } else {
                            setNewClass({
                              ...newClass,
                              gradeIds: [...newClass.gradeIds, gradeId],
                            });
                          }
                        }}
                        className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
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

              <button
                onClick={handleSaveClass}
                disabled={!newClass.name.trim() || newClass.gradeIds.length === 0}
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

export default Settings;
