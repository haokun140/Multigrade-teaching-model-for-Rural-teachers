import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, School, LogOut, ChevronRight, BookOpen, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { School as SchoolType } from '../types';
import BottomNav from '../components/BottomNav';
import TimeTimeline, { TimeSlot } from '../components/TimeTimeline';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [schoolRes, timeConfigsRes] = await Promise.all([
        api.getSchool(),
        api.getTimeConfigs(),
      ]);
      setSchool(schoolRes?.data || null);
      const configs = timeConfigsRes?.data || [];
      if (configs.length > 0) {
        setTimeSlots(configs.map((c: any) => ({
          id: c.id,
          type: c.type,
          startTime: c.startTime,
          endTime: c.endTime,
        })));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimeConfigs = async () => {
    setSavingTime(true);
    try {
      await api.updateTimeConfigs(timeSlots);
      alert('时间配置保存成功');
      setShowTimeModal(false);
    } catch (error) {
      console.error('保存时间配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSavingTime(false);
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
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <School className="w-4 h-4" />
              学校信息
            </h2>
            <button
              onClick={() => setShowTimeModal(true)}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              规则编辑
            </button>
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
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => navigate('/curriculum-config')}
          >
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              教材选择
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

      {/* 规则编辑弹窗 */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowTimeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">规则编辑</h3>
              <button onClick={() => setShowTimeModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <TimeTimeline
              timeSlots={timeSlots}
              onTimeSlotsChange={setTimeSlots}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  loadData();
                }}
                className="flex-1 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveTimeConfigs}
                disabled={savingTime}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingTime ? '保存中...' : '保存时间配置'}
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