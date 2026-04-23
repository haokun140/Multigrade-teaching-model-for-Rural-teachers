import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, BookOpen, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Timetable as TimetableType, Class as ClassType, Subject, Teacher } from '../types';
import BottomNav from '../components/BottomNav';

const DAYS = ['周一', '周二', '周三', '周四', '周五'];

const TIME_TYPES = [
  { value: 'morning-reading', label: '早读' },
  { value: 'class', label: '上课' },
  { value: 'self-study', label: '早/晚自习' },
  { value: 'exercise', label: '健身操' },
];

const getTypeLabel = (type: string) => {
  const typeObj = TIME_TYPES.find(t => t.value === type);
  return typeObj ? typeObj.label : type;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'morning-reading':
      return 'text-blue-600';
    case 'class':
      return 'text-green-600';
    case 'self-study':
      return 'text-yellow-600';
    case 'exercise':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

const SUBJECT_COLORS: Record<string, string> = {
  语文: 'bg-red-100 text-red-800',
  数学: 'bg-blue-100 text-blue-800',
  英语: 'bg-green-100 text-green-800',
  科学: 'bg-purple-100 text-purple-800',
  道德与法治: 'bg-orange-100 text-orange-800',
  音乐: 'bg-pink-100 text-pink-800',
  美术: 'bg-yellow-100 text-yellow-800',
  体育: 'bg-cyan-100 text-cyan-800',
};

const Timetable: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [timeConfigs, setTimeConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes, timeConfigsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTimeConfigs()
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTimeConfigs(timeConfigsRes.data || []);
      if (classesRes.data && classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const getTimetableForCell = (dayOfWeek: number, periodIndex: number) => {
    if (!selectedClass) return [];
    return timetables.filter(t => 
      t.classId === selectedClass.id && 
      t.dayOfWeek === dayOfWeek && 
      t.periodIndex === periodIndex
    );
  };

  const handleCellClick = (dayOfWeek: number, periodIndex: number) => {
    // 点击课程表单元格，跳转到创建横向备课页面
    if (selectedClass) {
      navigate('/horizontal-plans/new');
    }
  };

  const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS[subjectName] || 'bg-gray-100 text-gray-800';
  };

  // 生成课程表时间段
  const generatePeriods = () => {
    if (timeConfigs.length === 0) {
      // 默认时间段
      return [
        { id: 1, name: '第1节', time: '8:00-8:45' },
        { id: 2, name: '第2节', time: '8:55-9:40' },
        { id: 3, name: '第3节', time: '10:00-10:45' },
        { id: 4, name: '第4节', time: '10:55-11:40' },
        { id: 5, name: '第5节', time: '14:00-14:45' },
        { id: 6, name: '第6节', time: '14:55-15:40' },
      ];
    }

    // 按开始时间排序
    const sortedConfigs = [...timeConfigs].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1]);
    });

    // 生成时间段
    return sortedConfigs.map((config, index) => ({
      id: index + 1,
      name: `第${index + 1}节`,
      time: `${config.startTime.replace(':', ':')}-${config.endTime.replace(':', ':')}`,
      type: config.type
    }));
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
              <Calendar className="w-6 h-6 text-blue-600" />
              课程表
            </h1>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          {classes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedClass?.id === cls.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cls.name}
                  {cls.type === 'composite' && <span className="ml-1 text-xs">(复式)</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedClass ? (
        <div className="text-center py-12 px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有班级</h3>
            <p className="text-gray-500 mb-6">先创建一个班级，然后开始编排课程表</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              去创建班级
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-sm font-medium text-gray-600 w-20">
                      <Clock className="w-4 h-4 mx-auto" />
                    </th>
                    {DAYS.map((day, index) => (
                      <th key={index} className="px-2 py-3 text-sm font-medium text-gray-700 text-center">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {generatePeriods().map((period) => (
                    <tr key={period.id}>
                      <td className="px-2 py-3 bg-gray-50">
                        <div className="text-xs text-gray-500 text-center">
                          <div className="font-medium text-gray-700">{period.name}</div>
                          {period.type && <div className={`font-medium ${getTypeColor(period.type)}`}>{getTypeLabel(period.type)}</div>}
                          <div className="text-gray-400">{period.time}</div>
                        </div>
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const cellTimetables = getTimetableForCell(dayIndex + 1, period.id);
                        return (
                          <td
                            key={dayIndex}
                            onClick={() => handleCellClick(dayIndex + 1, period.id)}
                            className="px-2 py-2 border-l border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <div className="space-y-1">
                              {cellTimetables.map((tt) => {
                                const subject = getSubjectById(tt.subjectId);
                                return (
                                  <div
                                    key={tt.id}
                                    className={`rounded-lg p-2 text-xs ${getSubjectColor(subject?.name || '')}`}
                                  >
                                    <div className="font-medium truncate">{subject?.name}</div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="opacity-75">{tt.lessonType}</span>
                                      <div className="flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${tt.hasPrepared ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {cellTimetables.length === 0 && (
                                <div className="h-12 flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">备课状态</h3>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">已备课</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-600">未备课</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Timetable;
