import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Users, BookOpen, X, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Subject, TimetableEntry } from '../types';
import { ALL_GRADE_LABELS } from '../lib/grades';
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

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMon);
  return [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return { dayOfWeek: offset + 1, dateStr: `${d.getMonth() + 1}/${d.getDate()}` };
  });
}

const SubjectPicker: React.FC<{
  visible: boolean;
  title: string;
  subjects: Subject[];
  currentValue: string;
  onSelect: (subjectId: string) => void;
  onClose: () => void;
}> = ({ visible, title, subjects, currentValue, onSelect, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <button
            onClick={() => { onSelect(''); onClose(); }}
            className={`w-full text-left px-4 py-3.5 rounded-lg text-sm ${!currentValue ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-400'}`}
          >
            未设置
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose(); }}
              className={`w-full text-left px-4 py-3.5 rounded-lg text-sm border-b border-gray-50 ${
                currentValue === s.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TimetableEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [activeGradeId, setActiveGradeId] = useState<number | null>(null);
  const [timeConfigs, setTimeConfigs] = useState<any[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);

  // gradeData: gradeId -> dayOfWeek -> periodIndex -> subjectId (string only)
  const [gradeData, setGradeData] = useState<Map<number, Map<number, Map<number, string>>>>(new Map());
  const [existingEntryIds, setExistingEntryIds] = useState<Set<string>>(new Set());

  const [pickerConfig, setPickerConfig] = useState<{
    gradeId: number;
    dayOfWeek: number;
    periodIndex: number;
  } | null>(null);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const classId = searchParams.get('classId');
      const savedClassId = localStorage.getItem('lastTimetableClassId');
      const [classesRes, subjectsRes, timeConfigsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getTimeConfigs(),
      ]);

      const clsList = classesRes.data || [];
      setClasses(clsList);
      setSubjects(subjectsRes.data || []);
      setTimeConfigs(timeConfigsRes.data || []);

      let targetClass: ClassType | null = null;
      if (classId) {
        targetClass = clsList.find((c: ClassType) => c.id === classId) || null;
      }
      if (!targetClass && savedClassId) {
        targetClass = clsList.find((c: ClassType) => c.id === savedClassId) || null;
      }
      if (!targetClass && clsList.length > 0) {
        targetClass = clsList[0];
      }
      if (targetClass) {
        setSelectedClass(targetClass);
        localStorage.setItem('lastTimetableClassId', targetClass.id);
        if (targetClass.gradeIds.length > 0) {
          setActiveGradeId(targetClass.gradeIds[0]);
        }
        await loadTimetableForClass(targetClass);
      }

      setLoading(false);
    } catch (error) {
      console.error('加载数据失败:', error);
      setLoading(false);
    }
  };

  const loadTimetableForClass = async (cls: ClassType) => {
    try {
      const res = await api.getTimetable(cls.id);
      const entries = res.data || [];

      const data = new Map<number, Map<number, Map<number, string>>>();
      const ids = new Set<string>();

      entries.forEach((entry: TimetableEntry) => {
        ids.add(entry.id);
        const gId = entry.gradeId || cls.gradeIds[0];
        if (!data.has(gId)) {
          data.set(gId, new Map());
        }
        const dayMap = data.get(gId)!;
        if (!dayMap.has(entry.dayOfWeek)) {
          dayMap.set(entry.dayOfWeek, new Map());
        }
        const periodMap = dayMap.get(entry.dayOfWeek)!;
        periodMap.set(entry.periodIndex, entry.subjectId);
      });

      cls.gradeIds.forEach(gId => {
        if (!data.has(gId)) {
          data.set(gId, new Map());
        }
      });

      setGradeData(data);
      setExistingEntryIds(ids);
    } catch (error) {
      console.error('加载课程表失败:', error);
    }
  };

  const handleClassSwitch = (cls: ClassType) => {
    setSelectedClass(cls);
    localStorage.setItem('lastTimetableClassId', cls.id);
    if (cls.gradeIds.length > 0) {
      setActiveGradeId(cls.gradeIds[0]);
    }
    setShowClassModal(false);
    loadTimetableForClass(cls);
  };

  const getSubjectValue = (gradeId: number, dayOfWeek: number, periodIndex: number) => {
    return gradeData.get(gradeId)?.get(dayOfWeek)?.get(periodIndex);
  };

  const setSubjectValue = (gradeId: number, dayOfWeek: number, periodIndex: number, subjectId: string) => {
    setGradeData(prev => {
      const next = new Map(prev);
      if (!next.has(gradeId)) {
        next.set(gradeId, new Map());
      }
      const dayMap = new Map(next.get(gradeId)!);
      if (!dayMap.has(dayOfWeek)) {
        dayMap.set(dayOfWeek, new Map());
      }
      const periodMap = new Map(dayMap.get(dayOfWeek)!);
      if (subjectId) {
        periodMap.set(periodIndex, subjectId);
      } else {
        periodMap.delete(periodIndex);
      }
      dayMap.set(dayOfWeek, periodMap);
      next.set(gradeId, dayMap);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);

    try {
      const entries: Array<{
        dayOfWeek: number;
        periodIndex: number;
        subjectId: string;
        lessonType: 'new' | 'review' | 'practice';
        gradeId: number;
      }> = [];

      selectedClass.gradeIds.forEach(gId => {
        const dayMap = gradeData.get(gId);
        if (!dayMap) return;
        dayMap.forEach((periodMap, dayOfWeek) => {
          periodMap.forEach((subjectId, periodIndex) => {
            if (subjectId) {
              entries.push({
                dayOfWeek,
                periodIndex,
                subjectId,
                lessonType: 'new',
                gradeId: gId,
              });
            }
          });
        });
      });

      const res = await api.updateWeeklyTimetable(selectedClass.id, entries);
      if (res.success) {
        navigate('/timetable');
      } else {
        alert(res.error || '保存失败');
      }
    } catch (e) {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const weekDates = getWeekDates();
  const periods = generatePeriods(timeConfigs);

  const currentPickerSubject = pickerConfig
    ? getSubjectValue(pickerConfig.gradeId, pickerConfig.dayOfWeek, pickerConfig.periodIndex) || ''
    : '';

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
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">课程表配置</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>

          {classes.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setShowClassModal(true)}
                className="flex-1 flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-left"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 text-sm">
                    {selectedClass?.name || '选择班级'}
                  </span>
                  {selectedClass?.type === 'composite' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">复式班</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            </div>
          )}

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
                      onClick={() => handleClassSwitch(cls)}
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
                              {cls.gradeIds.map(id => ALL_GRADE_LABELS[id - 1]).join('、')}
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

          {selectedClass && selectedClass.gradeIds.length > 1 && (
            <div className="flex gap-1 mt-3">
              {selectedClass.gradeIds.map(gid => (
                <button
                  key={gid}
                  onClick={() => setActiveGradeId(gid)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeGradeId === gid
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ALL_GRADE_LABELS[gid - 1]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedClass && activeGradeId && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-sm font-medium text-gray-600 w-20">
                      <BookOpen className="w-4 h-4 mx-auto" />
                    </th>
                    {DAYS.map((day, index) => (
                      <th key={index} className="px-2 py-3 text-sm font-medium text-gray-700 text-center">
                        <div>{day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {periods.map((period) => (
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
                        const subjectId = getSubjectValue(activeGradeId, dayOfWeek, period.id) || '';
                        const subject = subjects.find(s => s.id === subjectId);

                        return (
                          <td key={dayIndex} className="px-1 py-1 border-l border-gray-100">
                            <button
                              onClick={() => setPickerConfig({ gradeId: activeGradeId, dayOfWeek, periodIndex: period.id })}
                              className={`w-full px-2 py-3 border rounded-lg text-sm text-left ${
                                subjectId ? 'border-blue-200 bg-blue-50 text-gray-900 font-medium' : 'border-gray-200 text-gray-400'
                              }`}
                            >
                              {subject ? subject.name : '点击设置'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            点击时段选择学科，每个年级每个时段只能设置一个科目
          </p>
          <p className="text-xs text-gray-400 mt-2 text-center">
            如果时段配置不正确，可在设置页面操作【学校时间配置】
          </p>
        </div>
      )}

      <SubjectPicker
        visible={!!pickerConfig}
        title={pickerConfig ? `${ALL_GRADE_LABELS[pickerConfig.gradeId - 1]} · 选择学科` : ''}
        subjects={subjects}
        currentValue={currentPickerSubject}
        onSelect={(subjectId) => {
          if (pickerConfig) {
            setSubjectValue(pickerConfig.gradeId, pickerConfig.dayOfWeek, pickerConfig.periodIndex, subjectId);
          }
        }}
        onClose={() => setPickerConfig(null)}
      />

      <BottomNav />
    </div>
  );
};

function generatePeriods(timeConfigs: any[]) {
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
    type: config.type,
  }));
}

export default TimetableEditor;
