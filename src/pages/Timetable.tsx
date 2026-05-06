import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Users, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Timetable as TimetableType, Class as ClassType, Subject, HorizontalPlan } from '../types';
import BottomNav from '../components/BottomNav';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
    case 'morning-reading': return 'text-blue-600';
    case 'class': return 'text-green-600';
    case 'self-study': return 'text-yellow-600';
    case 'exercise': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

const GRADE_COLORS = ['bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-gray-900'];
const GRADE_NAMES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

function getMondayOfWeek(date: Date) {
  const d = dayjs(date);
  const day = d.day();
  const diff = day === 0 ? 6 : day - 1;
  return d.subtract(diff, 'day').startOf('day').toDate();
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekDateRange(monday: Date) {
  const sunday = dayjs(monday).add(6, 'day').toDate();
  return `${formatDate(monday)}-${formatDate(sunday)}`;
}

function getToday() {
  return dayjs().startOf('day').toDate();
}

const Timetable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();
  const [timetables, setTimetables] = useState<TimetableType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [timeConfigs, setTimeConfigs] = useState<any[]>([]);
  const [horizontalPlans, setHorizontalPlans] = useState<Map<string, HorizontalPlan>>(new Map());
  const [loading, setLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  // Week navigation - force sync on mount to handle HMR state persistence
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(getToday()));

  useEffect(() => {
    setWeekMonday(getMondayOfWeek(getToday()));
  }, []);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedClass) {
      loadTimetableData();
    }
  }, [selectedClass]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes, timeConfigsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTimeConfigs()
      ]);
      const classList = classesRes.data || [];
      setClasses(classList);
      setSubjects(subjectsRes.data || []);
      setTimeConfigs(timeConfigsRes.data || []);

      // Select class: URL param > last saved > first class
      const classIdParam = searchParams.get('classId');
      const savedClassId = localStorage.getItem('lastTimetableClassId');
      let targetClass: ClassType | null = null;

      if (classIdParam) {
        targetClass = classList.find(c => c.id === classIdParam) || null;
      }
      if (!targetClass && savedClassId) {
        targetClass = classList.find(c => c.id === savedClassId) || null;
      }
      if (!targetClass && classList.length > 0) {
        targetClass = classList[0];
      }
      if (targetClass) {
        setSelectedClass(targetClass);
        localStorage.setItem('lastTimetableClassId', targetClass.id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableData = async () => {
    if (!selectedClass) return;
    setTimetableLoading(true);
    try {
      const res = await api.getTimetable(selectedClass.id);
      const entries = res.data || [];

      const planMap = new Map<string, HorizontalPlan>();
      for (const entry of entries) {
        if (entry.hasPrepared) {
          try {
            const planRes = await api.getHorizontalPlanByTimetable(entry.id);
            if (planRes.data) {
              planMap.set(entry.id, planRes.data);
            }
          } catch (e) {
            // 横向备课不存在则忽略
          }
        }
      }
      setHorizontalPlans(planMap);
      setTimetables(entries);
    } catch (error) {
      console.error('加载课程失败:', error);
      setTimetables([]);
    } finally {
      setTimetableLoading(false);
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

  const getGradeColor = (gradeId: number) => {
    return GRADE_COLORS[gradeId - 1] || 'bg-gray-400';
  };

  const getCellGradeSubjects = (entries: TimetableType[]) => {
    if (entries.length === 0) return [];

    const result: Array<{ gradeId: number; gradeName: string; subjectName: string; firstChar: string }> = [];

    entries.forEach(entry => {
      const subject = getSubjectById(entry.subjectId);
      const subjectName = subject?.name || '';
      const firstChar = getFirstChar(subjectName);

      if (entry.gradeId) {
        if (!result.find(r => r.gradeId === entry.gradeId)) {
          result.push({
            gradeId: entry.gradeId,
            gradeName: GRADE_NAMES[entry.gradeId - 1] || '',
            subjectName,
            firstChar,
          });
        }
      } else {
        const plan = horizontalPlans.get(entry.id);
        if (plan && plan.gradeSubjects.length > 0) {
          plan.gradeSubjects.forEach(gs => {
            if (!result.find(r => r.gradeId === gs.gradeId)) {
              const s = getSubjectById(gs.subjectId);
              result.push({
                gradeId: gs.gradeId,
                gradeName: GRADE_NAMES[gs.gradeId - 1] || '',
                subjectName: s?.name || '',
                firstChar: getFirstChar(s?.name || ''),
              });
            }
          });
        } else if (selectedClass) {
          selectedClass.gradeIds.forEach(gid => {
            if (!result.find(r => r.gradeId === gid)) {
              result.push({
                gradeId: gid,
                gradeName: GRADE_NAMES[gid - 1] || '',
                subjectName,
                firstChar: getFirstChar(subjectName),
              });
            }
          });
        }
      }
    });

    return result;
  };

  const getFirstChar = (name: string) => name ? name.charAt(0) : '?';

  const isPlanInCurrentWeek = (plan: HorizontalPlan): boolean => {
    if (!plan.lessonDate) return false; // 无日期则视为不在当前周
    const planTime = dayjs(plan.lessonDate).valueOf();
    const weekStart = dayjs(weekMonday).valueOf();
    const weekEnd = dayjs(weekMonday).add(6, 'day').endOf('day').valueOf();
    return planTime >= weekStart && planTime <= weekEnd;
  };

  const handleCellClick = (dayOfWeek: number, periodIndex: number) => {
    if (!selectedClass) return;
    const entries = getTimetableForCell(dayOfWeek, periodIndex);
    if (entries.length === 0) return;

    const periods = generatePeriods();
    const period = periods.find(p => p.id === periodIndex);
    const timeStr = period ? `${period.name} ${period.time}` : '';
    const lessonDate = dayjs(weekMonday).add(dayOfWeek - 1, 'day').format('YYYY-MM-DD');

    const plannedEntry = entries.find(e => {
      const plan = horizontalPlans.get(e.id);
      return plan && isPlanInCurrentWeek(plan);
    });
    if (plannedEntry) {
      const params = new URLSearchParams();
      params.set('timetableId', plannedEntry.id);
      params.set('dayOfWeek', String(dayOfWeek));
      params.set('date', lessonDate);
      if (timeStr) params.set('time', encodeURIComponent(timeStr));
      navigate(`/horizontal-plans/view?${params.toString()}`);
      return;
    }

    // 有旧方案（不同日期）→ 编辑，复用旧方案内容并更新日期
    const anyExisting = entries.find(e => horizontalPlans.has(e.id));
    if (anyExisting) {
      const params = new URLSearchParams();
      params.set('timetableId', anyExisting.id);
      params.set('dayOfWeek', String(dayOfWeek));
      params.set('date', lessonDate);
      if (timeStr) params.set('time', encodeURIComponent(timeStr));
      navigate(`/horizontal-plans/edit?${params.toString()}`);
      return;
    }

    // 无任何方案 → 新建

    const firstEntry = entries[0];
    const params = new URLSearchParams();
    params.set('classId', selectedClass.id);
    params.set('period', String(periodIndex));
    params.set('dayOfWeek', String(firstEntry.dayOfWeek));
    params.set('date', lessonDate);
    params.set('subjectId', firstEntry.subjectId);
    if (timeStr) params.set('time', encodeURIComponent(timeStr));
    navigate(`/horizontal-plans/new?${params.toString()}`);
  };

  const handleEmptyCellClick = (dayOfWeek: number, periodIndex: number) => {
    if (!selectedClass) return;
    const periods = generatePeriods();
    const period = periods.find(p => p.id === periodIndex);
    const timeStr = period ? `${period.name} ${period.time}` : '';
    const lessonDate = dayjs(weekMonday).add(dayOfWeek - 1, 'day').format('YYYY-MM-DD');
    const params = new URLSearchParams();
    params.set('classId', selectedClass.id);
    params.set('period', String(periodIndex));
    params.set('dayOfWeek', String(dayOfWeek));
    params.set('date', lessonDate);
    if (timeStr) params.set('time', encodeURIComponent(timeStr));
    navigate(`/horizontal-plans/new?${params.toString()}`);
  };

  const generatePeriods = () => {
    if (timeConfigs.length === 0) {
      return [
        { id: 1, name: '第1节', time: '8:00-8:45' },
        { id: 2, name: '第2节', time: '8:55-9:40' },
        { id: 3, name: '第3节', time: '10:00-10:45' },
        { id: 4, name: '第4节', time: '10:55-11:40' },
        { id: 5, name: '第5节', time: '14:00-14:45' },
        { id: 6, name: '第6节', time: '14:55-15:40' },
      ];
    }

    const sortedConfigs = [...timeConfigs].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1]);
    });

    return sortedConfigs.map((config, index) => ({
      id: index + 1,
      name: `第${index + 1}节`,
      time: `${config.startTime}-${config.endTime}`,
      type: config.type
    }));
  };

  const getWeekDates = () => {
    return [0, 1, 2, 3, 4, 5, 6].map(offset => {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + offset);
      return {
        dayOfWeek: offset + 1,
        dateStr: formatDate(d),
        fullDate: d,
      };
    });
  };

  const navigateWeek = (direction: -1 | 1) => {
    setWeekMonday(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * 7);
      return next;
    });
  };

  const goToCurrentWeek = () => {
    setWeekMonday(getMondayOfWeek(getToday()));
  };

  const isCurrentWeek = () => {
    const today = getMondayOfWeek(getToday());
    return weekMonday.getTime() === today.getTime();
  };

  const weekDates = getWeekDates();
  const todayTime = getToday().getTime();

  const isToday = (date: Date) => date.getTime() === todayTime;

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
              课程规划
            </h1>
            <button
              onClick={() => navigate('/classes')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          {classes.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClassModal(true)}
                className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-left"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {selectedClass?.name || '选择班级'}
                  </span>
                  {selectedClass?.type === 'composite' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">复式</span>
                  )}
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
              </button>
              <button
                onClick={() => navigate(`/timetable/edit?classId=${selectedClass?.id}`)}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shrink-0 text-sm font-medium"
              >
                课程表配置
              </button>
            </div>
          )}

          {/* Class selector modal */}
          {showClassModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowClassModal(false)}>
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">选择班级</h3>
                  <button onClick={() => setShowClassModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClass(cls);
                        localStorage.setItem('lastTimetableClassId', cls.id);
                        setShowClassModal(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                        selectedClass?.id === cls.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${selectedClass?.id === cls.id ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          {cls.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{cls.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {cls.type === 'composite' ? '复式班' : '单式班'}
                            <span className="ml-2">
                              {cls.gradeIds.map(id => GRADE_NAMES[id - 1]).join('、')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedClass?.id === cls.id && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigateWeek(-1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          上一周
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{getWeekDateRange(weekMonday)}</span>
          {isCurrentWeek() ? (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">本周</span>
          ) : (
            <button
              onClick={goToCurrentWeek}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              回到本周
            </button>
          )}
        </div>
        <button
          onClick={() => navigateWeek(1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          下一周
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!selectedClass ? (
        <div className="text-center py-12 px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有班级</h3>
            <p className="text-gray-500 mb-6">先创建一个班级，然后开始编排课程</p>
            <button
              onClick={() => navigate('/classes')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              去创建班级
            </button>
          </div>
        </div>
      ) : selectedClass && timetables.length === 0 && !timetableLoading && !loading ? (
        <div className="text-center py-12 px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请先配置课程表</h3>
            <p className="text-gray-500 mb-6">该班级还没有课程表，请先配置</p>
            <button
              onClick={() => navigate(`/timetable/edit?classId=${selectedClass?.id}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              课程表配置
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
                        <div>{day}</div>
                        <div className={`text-xs font-normal ${isToday(weekDates[index]?.fullDate) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                          {weekDates[index]?.dateStr}
                        </div>
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
                        const dayOfWeek = dayIndex + 1;
                        const cellEntries = getTimetableForCell(dayOfWeek, period.id);
                        const cellSubjects = getCellGradeSubjects(cellEntries);
                        const hasPrepared = cellEntries.some(e => {
                          const plan = horizontalPlans.get(e.id);
                          if (!plan) return false;
                          return isPlanInCurrentWeek(plan);
                        });
                        const hasEntries = cellEntries.length > 0;

                        return (
                          <td
                            key={dayIndex}
                            className={`px-1 py-1 border-l border-gray-100 align-top ${
                              hasEntries && !hasPrepared ? 'bg-gray-300/80' : ''
                            }`}
                          >
                            {hasEntries ? (
                              <div
                                className="min-h-[56px] cursor-pointer rounded-lg transition-colors p-1.5 border border-transparent hover:border-blue-300 hover:bg-blue-50"
                                onClick={() => handleCellClick(dayOfWeek, period.id)}
                              >
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  {cellSubjects.map((cs, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 text-xs">
                                      <span className={`inline-block w-2 h-2 rounded-full ${getGradeColor(cs.gradeId)}`}></span>
                                      <span className="text-gray-800">{cs.firstChar}</span>
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-1">
                                  <span className={`text-[11px] font-medium ${hasPrepared ? 'text-green-600' : 'text-red-400'}`}>
                                    {hasPrepared ? '已备课' : '未备课'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="min-h-[56px] flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => handleEmptyCellClick(dayOfWeek, period.id)}
                              >
                                <Plus className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">图例</h3>
            <div className="space-y-3">
              {selectedClass && (
                <div>
                  <h4 className="text-xs text-gray-400 mb-2">年级</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    {selectedClass.gradeIds.map(gid => (
                      <span key={gid} className="flex items-center gap-1.5 text-sm">
                        <span className={`w-3 h-3 rounded-full inline-block ${getGradeColor(gid)}`}></span>
                        <span className="text-gray-700">{GRADE_NAMES[gid - 1]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs text-gray-400 mb-2">备课状态</h4>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">已备课</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">未备课</span>
                  </span>
                </div>
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
