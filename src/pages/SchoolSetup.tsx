import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Users, Key, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useAuthStore, useAppStore } from '../store';
import TimeTimeline, { TimeSlot } from '../components/TimeTimeline';
import { SchoolType } from '../lib/grades';

export default function SchoolSetup() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建学校表单
  const [schoolName, setSchoolName] = useState('');
  const [region, setRegion] = useState('');
  const [schoolType, setSchoolType] = useState<SchoolType>('小学');
  
  // 学校时间配置
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', type: 'morning-reading', startTime: '07:30', endTime: '08:00' },
    { id: '2', type: 'class', startTime: '08:00', endTime: '08:40' },
    { id: '3', type: 'class', startTime: '08:50', endTime: '09:30' },
    { id: '4', type: 'class', startTime: '10:00', endTime: '10:40' },
    { id: '5', type: 'class', startTime: '10:50', endTime: '11:30' },
    { id: '6', type: 'class', startTime: '14:00', endTime: '14:40' },
    { id: '7', type: 'class', startTime: '14:50', endTime: '15:30' },
    { id: '8', type: 'self-study', startTime: '16:30', endTime: '18:00' },
  ]);

  // 加入学校表单
  const [inviteCode, setInviteCode] = useState('');

  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { setSchool, setSubjects } = useAppStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.createSchool({
        name: schoolName,
        region,
        type: schoolType,
        timeSlots
      });

      if (response.success && response.data) {
        updateUser({ schoolId: response.data.user.schoolId });

        // 获取学校信息
        const schoolRes = await api.getSchool();
        if (schoolRes.success && schoolRes.data) {
          setSchool(schoolRes.data);
        }

        // 获取默认学科
        const subjectsRes = await api.getSubjects();
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data);
        }

        navigate('/');
      } else {
        setError(response.error || '创建失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.joinSchool({ inviteCode });

      if (response.success && response.data) {
        updateUser({ schoolId: response.data.user.schoolId });

        // 获取学校信息
        const schoolRes = await api.getSchool();
        if (schoolRes.success && schoolRes.data) {
          setSchool(schoolRes.data);
        }

        // 获取默认学科
        const subjectsRes = await api.getSubjects();
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data);
        }

        navigate('/');
      } else {
        setError(response.error || '加入失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">设置学校</h1>
          <p className="text-gray-600 mt-2">
            {user?.name}，欢迎加入复式教育备课系统
          </p>
        </div>

        {/* 模式切换 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            创建学校
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            加入学校
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校名称
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="请输入学校名称"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  maxLength={30}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地区
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="请输入所在地区"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校类型
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value as any)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="小学">小学</option>
                  <option value="初中">初中</option>
                  <option value="小学（五•四学制）">小学（五•四学制）</option>
                  <option value="初中（五•四学制）">初中（五•四学制）</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <TimeTimeline 
                timeSlots={timeSlots} 
                onTimeSlotsChange={setTimeSlots} 
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '创建中...' : '创建学校'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-5">
            <div className="text-center py-4">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                请输入您收到的学校邀请码加入学校
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邀请码
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="请输入6位邀请码"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                '加入中...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  加入学校
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
