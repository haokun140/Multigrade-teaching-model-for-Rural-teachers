import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Save, Users, BookOpen, Clock, Calendar, GripVertical, ChevronDown, ChevronUp, Trash2, X, Check, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Subject, LessonStep, LessonPlan, CurriculumConfig } from '../types';
import BottomNav from '../components/BottomNav';

interface Track {
  gradeId: number;
  gradeName: string;
  subjectId: string;
  subjectName?: string;
  version: string;
  volume: string;
  units: string[];
  lessonPlans?: LessonPlan[];
}

interface GradeStepData {
  gradeId: number;
  selectedStepIds: string[];
  selectedSteps: LessonStep[];
  blackboard: string;
}

interface TeachingStep {
  id: string;
  type: 'dynamic-static' | 'cross-grade';
  duration: number;
  gradeSteps: GradeStepData[];
  crossGradeStep: {
    gradeSubjects: Array<{ gradeId: number; subjectId: string; version: string; volume: string }>;
    name: string;
    content: string;
    materials: string;
    hasAssistant: boolean;
    blackboard: string;
  };
}

interface HomeworkItem {
  gradeId: number;
  content: string;
}

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateFromDayOfWeek(dayOfWeek: number): string {
  const monday = getMondayOfWeek(new Date());
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayOfWeek - 1);
  return `${date.getMonth() + 1}月${date.getDate()}日（${DAY_NAMES[dayOfWeek - 1]}）`;
}

function parseTimeFromPeriodInfo(periodInfo: string | null): { timeRange: string; periodName: string } | null {
  if (!periodInfo) return null;
  const match = periodInfo.match(/^(第\d+节)\s+(.+)$/);
  if (match) {
    return { periodName: match[1], timeRange: match[2] };
  }
  return { periodName: '', timeRange: periodInfo };
}

const LessonPicker: React.FC<{
  visible: boolean;
  subjectId: string;
  gradeId: number;
  version: string;
  volume: string;
  lessonPlans: LessonPlan[];
  selectedTitles: string[];
  onSelect: (plan: LessonPlan) => void;
  onRemove: (title: string) => void;
  onClose: () => void;
}> = ({ visible, subjectId, gradeId, version, volume, lessonPlans, selectedTitles, onSelect, onRemove, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  const filtered = lessonPlans.filter(p =>
    p.subjectId === subjectId &&
    p.gradeId === gradeId &&
    p.version === version &&
    p.volume === volume &&
    p.status === 'completed'
  );

  const searched = searchQuery.trim()
    ? filtered.filter(p =>
        p.title.includes(searchQuery.trim()) ||
        (p.unit && p.unit.includes(searchQuery.trim()))
      )
    : filtered;

  const groupedByUnit = new Map<string, LessonPlan[]>();
  searched.forEach(p => {
    const unit = p.unit || '未分组';
    if (!groupedByUnit.has(unit)) groupedByUnit.set(unit, []);
    groupedByUnit.get(unit)!.push(p);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">选择课题</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Search input */}
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单元或课题..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {groupedByUnit.size === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">{searchQuery ? '未找到匹配的课题' : '暂无符合条件的纵向备课方案'}</p>
          ) : (
            Array.from(groupedByUnit.entries()).map(([unit, plans]) => (
              <div key={unit} className="mb-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-1">
                  <BookOpen className="w-4 h-4 text-gray-500 shrink-0" />
                  <h4 className="text-sm font-medium text-gray-700">{unit}</h4>
                  <span className="text-xs text-gray-400 ml-auto">{plans.length}课时</span>
                </div>
                <div className="space-y-0.5 ml-1">
                  {plans.map(plan => {
                    const isSelected = selectedTitles.includes(plan.title);
                    return (
                      <button
                        key={plan.id}
                        onClick={() => isSelected ? onRemove(plan.title) : onSelect(plan)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${isSelected ? 'font-medium text-blue-700' : 'text-gray-900'}`}>
                            {plan.title}
                          </div>
                          {plan.unit && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate">{plan.unit}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Version picker modal (single-select)
const VersionPickerModal: React.FC<{
  versions: string[];
  selectedVersion: string;
  onSelect: (version: string) => void;
  onClose: () => void;
}> = ({ versions, selectedVersion, onSelect, onClose }) => {
  const uniqueVersions = [...new Set(versions)].filter(Boolean);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">选择教材版本</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {uniqueVersions.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">请先在课程配置中添加版本信息</p>
          ) : (
            <div className="space-y-1">
              {uniqueVersions.map(v => (
                <button
                  key={v}
                  onClick={() => { onSelect(v); onClose(); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedVersion === v ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedVersion === v ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedVersion === v && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </span>
                  <span className={`text-sm ${selectedVersion === v ? 'font-medium text-blue-700' : 'text-gray-900'}`}>{v}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Volume picker modal (single-select)
const VolumePickerModal: React.FC<{
  volumes: string[];
  selectedVolume: string;
  onSelect: (volume: string) => void;
  onClose: () => void;
}> = ({ volumes, selectedVolume, onSelect, onClose }) => {
  const uniqueVolumes = [...new Set(volumes)].filter(Boolean);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">选择册次</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {uniqueVolumes.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">暂无可用册次，请先在课程配置中添加</p>
          ) : (
            <div className="space-y-1">
              {uniqueVolumes.map(v => (
                <button
                  key={v}
                  onClick={() => { onSelect(v); onClose(); }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedVolume === v ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedVolume === v ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedVolume === v && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </span>
                  <span className={`text-sm ${selectedVolume === v ? 'font-medium text-blue-700' : 'text-gray-900'}`}>{v}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Subject picker modal (single-select)
const SubjectPickerModal: React.FC<{
  subjects: Subject[];
  selectedSubjectId: string;
  onSelect: (subjectId: string) => void;
  onClose: () => void;
}> = ({ subjects, selectedSubjectId, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">选择学科</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <div className="space-y-1">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { onSelect(s.id); onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  selectedSubjectId === s.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedSubjectId === s.id ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {selectedSubjectId === s.id && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </span>
                <span className={`text-sm ${selectedSubjectId === s.id ? 'font-medium text-blue-700' : 'text-gray-900'}`}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HorizontalPlanEdit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const periodInfo = searchParams.get('time') ? decodeURIComponent(searchParams.get('time')!) : null;
  const timetableSubjectId = searchParams.get('subjectId');
  const dayOfWeekStr = searchParams.get('dayOfWeek');
  const dayOfWeek = dayOfWeekStr ? parseInt(dayOfWeekStr) : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculumConfigs, setCurriculumConfigs] = useState<CurriculumConfig[]>([]);
  const [allLessonPlans, setAllLessonPlans] = useState<LessonPlan[]>([]);

  // Step 1 state
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(45);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);

  // Lesson picker state (which track index is picking a lesson)
  const [lessonPickerTrackIndex, setLessonPickerTrackIndex] = useState<number | null>(null);

  // Version/volume picker state
  const [versionPickerTrackIndex, setVersionPickerTrackIndex] = useState<number | null>(null);
  const [volumePickerTrackIndex, setVolumePickerTrackIndex] = useState<number | null>(null);
  const [subjectPickerTrackIndex, setSubjectPickerTrackIndex] = useState<number | null>(null);

  // Step 2 state
  const [teachingSteps, setTeachingSteps] = useState<TeachingStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [homework, setHomework] = useState<HomeworkItem[]>([]);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const stepListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes, configsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getCurriculumConfigs(),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setCurriculumConfigs(configsRes.data || []);

      const tid = searchParams.get('timetableId');
      const classId = searchParams.get('classId');

      if (tid) {
        setTimetableId(tid);
        // Try to load existing plan
        try {
          const planRes = await api.getHorizontalPlanByTimetable(tid);
          if (planRes.data) {
            const plan = planRes.data;
            setExistingPlanId(plan.id);
            setSelectedClass(plan.classId);
            setLessonDuration(plan.lessonDuration || 45);

            // Restore tracks
            if (plan.tracks && plan.tracks.length > 0) {
              const restoredTracks: Track[] = plan.tracks.map((t: any) => ({
                gradeId: t.gradeId,
                gradeName: t.gradeName || GRADES[t.gradeId - 1] || '',
                subjectId: t.subjectId,
                subjectName: t.subjectName || '',
                version: t.version || '',
                volume: t.volume || '',
                units: t.units || [],
                lessonPlans: t.lessonPlans,
              }));
              setTracks(restoredTracks);
            }

            // Restore teaching steps
            if (plan.interactions && plan.interactions.length > 0) {
              const restoredSteps: TeachingStep[] = plan.interactions.map((interaction: any, idx: number) => ({
                id: `step-${idx}-${Date.now()}`,
                type: (interaction.stepType || 'cross-grade') as 'dynamic-static' | 'cross-grade',
                duration: interaction.duration || 15,
                gradeSteps: (interaction.gradeSteps || []).map((gs: any) => ({
                  gradeId: gs.gradeId,
                  selectedStepIds: gs.selectedStepIds || [],
                  selectedSteps: gs.selectedSteps || [],
                  blackboard: gs.blackboard || '',
                })),
                crossGradeStep: {
                  gradeSubjects: interaction.gradeSubjects || [],
                  name: interaction.name || '',
                  content: interaction.content || '',
                  materials: interaction.materials || '',
                  hasAssistant: interaction.hasAssistant || false,
                  blackboard: interaction.blackboard || '',
                },
              }));
              setTeachingSteps(restoredSteps);
            }

            // Restore homework
            if (plan.homework && Array.isArray(plan.homework)) {
              setHomework(plan.homework);
            }

            // Go to step 2 for editing
            setCurrentStep(2);
          }
        } catch (e) {
          // Plan doesn't exist yet, go to step 1
          if (classId) setSelectedClass(classId);
        }
      } else if (classId) {
        setSelectedClass(classId);
      }

      // Load lesson plans for step selection
      try {
        const plansRes = await api.getAllLessonPlans();
        if (plansRes.data) {
          setAllLessonPlans(plansRes.data);
        }
      } catch (e) {
        console.error('加载备课方案失败:', e);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to look up subject name
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || '';

  // When class changes, update tracks with auto-fill from timetable
  useEffect(() => {
    if (!selectedClass || tracks.length > 0 || existingPlanId) return;

    const initTracks = async () => {
      const cls = classes.find(c => c.id === selectedClass);
      if (!cls) return;

      // Build grade->subject mapping from timetable entries
      const dayOfWeekStr = searchParams.get('dayOfWeek');
      const periodStr = searchParams.get('period');
      const gradeSubjectMap = new Map<number, string>();

      if (dayOfWeekStr && periodStr) {
        try {
          const res = await api.getTimetable(selectedClass);
          (res.data || []).forEach((e: any) => {
            if (e.dayOfWeek === parseInt(dayOfWeekStr) && e.periodIndex === parseInt(periodStr) && e.gradeId) {
              gradeSubjectMap.set(e.gradeId, e.subjectId);
            }
          });
        } catch (e) {
          console.error('加载课程表数据失败:', e);
        }
      }

      setTracks(cls.gradeIds
        .filter(gid => {
          // When coming from timetable, only show grades that have an entry for this slot
          const hasEntry = gradeSubjectMap.has(gid);
          if (dayOfWeekStr && periodStr) {
            return hasEntry;
          }
          return true;
        })
        .map(gid => {
        const subjectId = gradeSubjectMap.get(gid) || timetableSubjectId || '';
        const track: Track = {
          gradeId: gid,
          gradeName: GRADES[gid - 1],
          subjectId,
          subjectName: subjectId ? getSubjectName(subjectId) : '',
          version: '',
          volume: '',
          units: [],
        };

        // Auto-fill version/volume from curriculum config
        if (subjectId) {
          const configs = curriculumConfigs.filter(c => c.subjectId === subjectId && c.gradeId === gid);
          if (configs.length > 0) {
            // 如果有多个版本，自动带入录入时间最新的
            const sorted = [...configs].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const config = sorted[0];
            track.version = config.version;
            // 如果该版本的教材下只有一个册次则自动带入，多个则自动带入最新的
            track.volume = config.volumes.length > 0 ? config.volumes[config.volumes.length - 1] : '';
          }
        }

        return track;
      }));
    };

    initTracks();
  }, [selectedClass, classes, tracks.length, existingPlanId, timetableSubjectId, curriculumConfigs]);

  // Init homework when tracks change
  useEffect(() => {
    if (tracks.length > 0 && homework.length === 0) {
      setHomework(tracks.map(t => ({ gradeId: t.gradeId, content: '' })));
    }
  }, [tracks, homework.length]);

  const getConfigForSubjectGrade = (subjectId: string, gradeId: number) => {
    return curriculumConfigs.find(c => c.subjectId === subjectId && c.gradeId === gradeId);
  };

  const getLessonPlansForGradeSubject = (gradeId: number, subjectId: string) => {
    return allLessonPlans.filter(p => p.gradeId === gradeId && p.subjectId === subjectId && p.status === 'completed');
  };

  const handleSubjectChange = (trackIndex: number, subjectId: string) => {
    const newTracks = [...tracks];
    const subject = subjects.find(s => s.id === subjectId);
    newTracks[trackIndex] = {
      ...newTracks[trackIndex],
      subjectId,
      subjectName: subject?.name || '',
      version: '',
      volume: '',
      units: [],
    };

    // Auto-fill version/volume from curriculum config
    if (subjectId) {
      const configs = curriculumConfigs.filter(c => c.subjectId === subjectId && c.gradeId === newTracks[trackIndex].gradeId);
      if (configs.length > 0) {
        const sorted = [...configs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const config = sorted[0];
        newTracks[trackIndex].version = config.version;
        newTracks[trackIndex].volume = config.volumes.length > 0 ? config.volumes[config.volumes.length - 1] : '';
      }
    }
    setTracks([...newTracks]);
  };

  const updateTrack = (trackIndex: number, updates: Partial<Track>) => {
    const newTracks = [...tracks];
    newTracks[trackIndex] = { ...newTracks[trackIndex], ...updates };
    setTracks(newTracks);
  };

  const handleSelectLesson = (trackIndex: number, plan: LessonPlan) => {
    const track = tracks[trackIndex];
    if (track.units.includes(plan.title)) return;
    updateTrack(trackIndex, {
      units: [...track.units, plan.title],
      lessonPlans: [...(track.lessonPlans || []), plan],
    });
  };

  const handleRemoveLesson = (trackIndex: number, title: string) => {
    const track = tracks[trackIndex];
    const idx = track.units.indexOf(title);
    if (idx === -1) return;
    updateTrack(trackIndex, {
      units: track.units.filter((_, i) => i !== idx),
      lessonPlans: track.lessonPlans?.filter((_, i) => i !== idx),
    });
  };

  const getAvailableVersions = (trackIndex: number) => {
    const track = tracks[trackIndex];
    if (!track.subjectId) return [];
    const configs = curriculumConfigs.filter(c => c.subjectId === track.subjectId && c.gradeId === track.gradeId);
    return [...new Set(configs.map(c => c.version).filter(Boolean))];
  };

  const getAvailableVolumes = (trackIndex: number) => {
    const track = tracks[trackIndex];
    if (!track.subjectId || !track.version) return [];
    const config = curriculumConfigs.find(c => c.subjectId === track.subjectId && c.gradeId === track.gradeId && c.version === track.version);
    return config?.volumes || [];
  };

  const generateStepId = () => `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const handleAddStep = () => {
    const newStep: TeachingStep = {
      id: generateStepId(),
      type: 'dynamic-static',
      duration: 15,
      gradeSteps: tracks.map(t => ({
        gradeId: t.gradeId,
        selectedStepIds: [],
        selectedSteps: [],
        blackboard: '',
      })),
      crossGradeStep: {
        gradeSubjects: tracks.map(t => ({ gradeId: t.gradeId, subjectId: t.subjectId, version: t.version, volume: t.volume })),
        name: '',
        content: '',
        materials: '',
        hasAssistant: false,
        blackboard: '',
      },
    };
    setTeachingSteps([...teachingSteps, newStep]);
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
  };

  const handleRemoveStep = (stepId: string) => {
    setTeachingSteps(prev => prev.filter(s => s.id !== stepId));
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
  };

  const handleStepTypeChange = (stepId: string, type: 'dynamic-static' | 'cross-grade') => {
    setTeachingSteps(prev => prev.map(s => s.id === stepId ? { ...s, type } : s));
  };

  const handleStepDurationChange = (stepId: string, duration: number) => {
    setTeachingSteps(prev => prev.map(s => s.id === stepId ? { ...s, duration } : s));
  };

  const toggleExpandAll = () => {
    if (expandedSteps.size === teachingSteps.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(teachingSteps.map(s => s.id)));
    }
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) newSet.delete(stepId);
      else newSet.add(stepId);
      return newSet;
    });
  };

  // Drag handlers
  const handleDragStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragIndex(index);
    if ('touches' in e) {
      dragStartY.current = e.touches[0].clientY;
    } else {
      dragStartY.current = e.clientY;
    }
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (dragIndex === null) return;
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragStartY.current;
    if (Math.abs(delta) > 30) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = dragIndex + direction;
      if (newIndex >= 0 && newIndex < teachingSteps.length && newIndex !== dragIndex) {
        const newSteps = [...teachingSteps];
        const [removed] = newSteps.splice(dragIndex, 1);
        newSteps.splice(newIndex, 0, removed);
        setTeachingSteps(newSteps);
        setDragIndex(newIndex);
        dragStartY.current = clientY;
      }
    }
  }, [dragIndex, teachingSteps]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  useEffect(() => {
    if (dragIndex !== null) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragIndex, handleDragMove, handleDragEnd]);

  // Dynamic-static step: select/deselect step from lesson plan
  const toggleStepSelection = (stepId: string, gradeId: number, step: LessonStep) => {
    setTeachingSteps(prev => prev.map(s => {
      if (s.id !== stepId || s.type !== 'dynamic-static') return s;
      const gs = s.gradeSteps.find(g => g.gradeId === gradeId);
      if (!gs) return s;
      const isSelected = gs.selectedStepIds.includes(step.id);
      return {
        ...s,
        gradeSteps: s.gradeSteps.map(g => g.gradeId === gradeId ? {
          ...g,
          selectedStepIds: isSelected
            ? g.selectedStepIds.filter(id => id !== step.id)
            : [...g.selectedStepIds, step.id],
          selectedSteps: isSelected
            ? g.selectedSteps.filter(ss => ss.id !== step.id)
            : [...g.selectedSteps, step],
        } : g),
      };
    }));
  };

  const handleGradeStepBlackboard = (stepId: string, gradeId: number, value: string) => {
    setTeachingSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        gradeSteps: s.gradeSteps.map(g => g.gradeId === gradeId ? { ...g, blackboard: value } : g),
      };
    }));
  };

  const handleCrossGradeChange = (stepId: string, field: string, value: any) => {
    setTeachingSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, crossGradeStep: { ...s.crossGradeStep, [field]: value } };
    }));
  };

  const handleHomeworkChange = (gradeId: number, content: string) => {
    setHomework(prev => {
      const existing = prev.findIndex(h => h.gradeId === gradeId);
      if (existing >= 0) {
        const newArr = [...prev];
        newArr[existing] = { ...newArr[existing], content };
        return newArr;
      }
      return [...prev, { gradeId, content }];
    });
  };

  const handleNext = () => {
    // Validate step 1: each track must have a subject selected
    const incomplete = tracks.some(t => !t.subjectId);
    if (incomplete) {
      alert('请为每个年级选择学科');
      return;
    }
    setCurrentStep(2);
  };

  const moveToStep = (step: 1 | 2) => {
    setCurrentStep(step);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let planId = existingPlanId;
      let currentTimetableId = timetableId || searchParams.get('timetableId');

      if (!planId) {
        // If no timetable entry yet, create one first
        if (!currentTimetableId) {
          const firstTrack = tracks.find(t => t.subjectId);
          if (!firstTrack || !selectedClass) {
            alert('请先配置至少一个年级的学科');
            setSaving(false);
            return;
          }
          const dayOfWeek = parseInt(searchParams.get('dayOfWeek') || '1');
          const periodIndex = parseInt(searchParams.get('period') || '1');
          const ttRes = await api.setTimetableEntry({
            classId: selectedClass,
            dayOfWeek,
            periodIndex,
            subjectId: firstTrack.subjectId,
            lessonType: 'new',
          });
          if (ttRes.success && ttRes.data) {
            currentTimetableId = ttRes.data.id;
            setTimetableId(ttRes.data.id);
          } else {
            alert('创建课程表条目失败');
            setSaving(false);
            return;
          }
        }

        if (!selectedClass) {
          alert('缺少必要信息');
          setSaving(false);
          return;
        }

        const createRes = await api.createHorizontalPlan({
          classId: selectedClass,
          timetableId: currentTimetableId,
          gradeSubjects: tracks.map(t => ({ gradeId: t.gradeId, subjectId: t.subjectId })),
          lessonDuration,
          lessonDate: searchParams.get('date') || undefined,
        });

        if (createRes.success && createRes.data) {
          planId = createRes.data.id;
          setExistingPlanId(planId);
        } else {
          alert(createRes.error || '创建失败');
          setSaving(false);
          return;
        }
      }

      // Update plan with tracks, interactions, homework
      const updateData: any = {
        tracks: tracks.map(t => ({
          ...t,
          lessonPlans: t.lessonPlans || [],
        })),
        interactions: teachingSteps.map(s => ({
          stepType: s.type,
          duration: s.duration,
          gradeSteps: s.gradeSteps,
          gradeSubjects: s.crossGradeStep.gradeSubjects,
          name: s.crossGradeStep.name,
          content: s.crossGradeStep.content,
          materials: s.crossGradeStep.materials,
          hasAssistant: s.crossGradeStep.hasAssistant,
          blackboard: s.crossGradeStep.blackboard,
        })),
        homework,
        status: 'completed' as const,
        lessonDate: searchParams.get('date') || undefined,
      };

      const updateRes = await api.updateHorizontalPlan(planId, updateData);
      if (updateRes.success) {
        // Preserve date/time params for the view page
        const params = new URLSearchParams();
        params.set('timetableId', currentTimetableId);
        const dow = searchParams.get('dayOfWeek');
        const time = searchParams.get('time');
        const date = searchParams.get('date');
        if (dow) params.set('dayOfWeek', dow);
        if (time) params.set('time', time);
        if (date) params.set('date', date);
        navigate(`/horizontal-plans/view?${params.toString()}`);
      } else {
        alert(updateRes.error || '保存失败');
      }
    } catch (e) {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
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

  const totalDuration = teachingSteps.reduce((sum, s) => sum + s.duration, 0);

  const getLessonPlansForTrack = (track: Track) => {
    // Only show steps from lesson plans selected on step 1, not all plans for this grade/subject
    if (track.lessonPlans && track.lessonPlans.length > 0) {
      return track.lessonPlans;
    }
    // Fallback: filter by selected unit/topic titles
    return allLessonPlans.filter(p =>
      p.gradeId === track.gradeId &&
      p.subjectId === track.subjectId &&
      track.units.includes(p.title) &&
      p.status === 'completed'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentStep === 2) navigate(-1);
                else navigate('/timetable');
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">横向备课</h1>
            {currentStep === 1 ? (
              <button
                onClick={handleNext}
                disabled={tracks.length === 0 || tracks.some(t => !t.subjectId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={() => moveToStep(1)}
                className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50"
              >
                上一步
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1.5 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">配置学科</span>
            <span className="text-xs text-gray-500">教学步骤与作业</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {currentStep === 1 && (
          <>
            {/* Timetable context - read-only info when coming from timetable */}
            {(timetableSubjectId || periodInfo || dayOfWeek) && selectedClass && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  课程信息
                </h2>
                <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-gray-500">班级：</span>
                    <span className="font-medium text-gray-900">
                      {classes.find(c => c.id === selectedClass)?.name || selectedClass}
                      {classes.find(c => c.id === selectedClass)?.type === 'composite' ? '（复式班）' : ''}
                    </span>
                  </div>
                  {timetableSubjectId && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-gray-500">学科：</span>
                      <span className="font-medium text-gray-900">
                        {subjects.find(s => s.id === timetableSubjectId)?.name || timetableSubjectId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-gray-500">日期：</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const dateParam = searchParams.get('date');
                        if (dateParam) {
                          const d = dayjs(dateParam);
                          const dayName = DAY_NAMES[d.day() === 0 ? 6 : d.day() - 1];
                          return `${d.format('M月D日')}（${dayName}）`;
                        }
                        return dayOfWeek ? formatDateFromDayOfWeek(dayOfWeek) : '-';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-gray-500">时间：</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const parsed = parseTimeFromPeriodInfo(periodInfo);
                        if (parsed) return `${parsed.timeRange}（${parsed.periodName}）`;
                        return dayOfWeek ? '当前时段' : '-';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Class selection - only show when NOT coming from timetable */}
            {!timetableSubjectId && !dayOfWeek && !searchParams.get('timetableId') && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  选择班级
                </h2>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!existingPlanId}
                >
                  <option value="">请选择班级</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.type === 'composite' ? '(复式班)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grade subject configuration */}
            {tracks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-4">各年级配置</h2>
                <div className="space-y-4">
                  {tracks.map((track, idx) => {
                    return (
                      <div key={track.gradeId} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">{track.gradeName}</h3>

                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => setSubjectPickerTrackIndex(idx)}
                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:border-blue-300 transition-colors"
                          >
                            <span className={track.subjectId ? 'text-gray-900' : 'text-gray-400'}>
                              {track.subjectName || '选择学科'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                          </button>

                          {track.subjectId && (
                            <>
                              {/* Version selector button */}
                              <button
                                type="button"
                                onClick={() => setVersionPickerTrackIndex(idx)}
                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:border-blue-300 transition-colors"
                              >
                                <span className={track.version ? 'text-gray-900' : 'text-gray-400'}>
                                  {track.version || '选择教材版本'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              </button>

                              {/* Volume selector button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (!track.version) {
                                    alert('请先选择教材版本');
                                    return;
                                  }
                                  setVolumePickerTrackIndex(idx);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:border-blue-300 transition-colors"
                              >
                                <span className={track.volume ? 'text-gray-900' : 'text-gray-400'}>
                                  {track.volume || '选择册次'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                              </button>

                              {/* Lesson picker button */}
                              <button
                                type="button"
                                onClick={() => setLessonPickerTrackIndex(idx)}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <BookOpen className="w-4 h-4" />
                                选择单元和课题
                              </button>

                              {/* Selected topics display below the button */}
                              {track.units.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {track.units.map((unit, ui) => (
                                    <span key={ui} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                      {unit}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newUnits = track.units.filter((_, i) => i !== ui);
                                          const newPlans = track.lessonPlans?.filter((_, i) => i !== ui);
                                          updateTrack(idx, { units: newUnits, lessonPlans: newPlans });
                                        }}
                                        className="hover:text-blue-900"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* Selected units display */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">已选配置</h2>
              <div className="space-y-2">
                {tracks.map(track => (
                  <div key={track.gradeId} className="flex flex-wrap items-center gap-1 text-sm">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                    <span className="text-gray-600">{track.subjectName || '未选'}</span>
                    {track.version && <span className="text-gray-400 text-xs">{track.version}</span>}
                    {track.volume && <span className="text-gray-400 text-xs">{track.volume}</span>}
                    {track.units.map((u, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{u}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Teaching steps */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-gray-700">教学步骤</h2>
                  <span className="text-xs text-gray-400">{totalDuration}分钟</span>
                </div>
                <div className="flex items-center gap-2">
                  {teachingSteps.length > 0 && (
                    <button
                      onClick={toggleExpandAll}
                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                    >
                      {expandedSteps.size === teachingSteps.length ? '收起全部' : '展开全部'}
                    </button>
                  )}
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加步骤
                  </button>
                </div>
              </div>

              {teachingSteps.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无教学步骤，点击"添加步骤"开始
                </div>
              ) : (
                <div ref={stepListRef} className="space-y-3">
                  {teachingSteps.map((step, idx) => {
                    const isExpanded = expandedSteps.has(step.id);
                    const isDragging = dragIndex === idx;

                    return (
                      <div
                        key={step.id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isDragging ? 'border-blue-400 shadow-lg scale-[1.02] bg-white z-10' : 'border-gray-200'
                        } ${isDragging ? 'relative' : ''}`}
                        style={isDragging ? { position: 'relative', zIndex: 100 } : {}}
                      >
                        {/* Step header */}
                        <div
                          className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 select-none"
                          onClick={() => toggleStepExpanded(step.id)}
                        >
                          <div
                            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
                            onMouseDown={(e) => handleDragStart(idx, e)}
                            onTouchStart={(e) => handleDragStart(idx, e)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium shrink-0">
                            {idx + 1}
                          </span>

                          <select
                            value={step.type}
                            onChange={(e) => handleStepTypeChange(step.id, e.target.value as any)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${
                              step.type === 'dynamic-static'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            <option value="dynamic-static">动+静</option>
                            <option value="cross-grade">跨年级互动</option>
                          </select>

                          <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={step.duration}
                              onChange={(e) => handleStepDurationChange(step.id, Math.max(1, parseInt(e.target.value) || 1))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 px-1 py-0.5 border border-gray-200 rounded text-xs text-center"
                            />
                            分钟
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('确定要删除此教学步骤吗？')) {
                                handleRemoveStep(step.id);
                              }
                            }}
                            className="p-1 text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </div>

                        {/* Step content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-gray-100">
                            {step.type === 'dynamic-static' ? (
                              <div className="space-y-3 mt-3">
                                {tracks.map(track => {
                                  const plans = getLessonPlansForTrack(track);
                                  const gs = step.gradeSteps.find(g => g.gradeId === track.gradeId);
                                  const selectedSteps = gs?.selectedSteps || [];
                                  return (
                                    <div key={track.gradeId} className="border border-gray-100 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                                        <span className="text-xs text-gray-500">{track.subjectName}</span>
                                      </div>

                                      {/* Step selection */}
                                      {plans.length > 0 ? (
                                        <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
                                          {plans.map(plan =>
                                            plan.steps.map(s => {
                                              const isSelected = gs?.selectedStepIds.includes(s.id) || false;
                                              return (
                                                <label
                                                  key={s.id}
                                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                                                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                  }`}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleStepSelection(step.id, track.gradeId, s)}
                                                    className="rounded border-gray-300 text-blue-600"
                                                  />
                                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                    s.type === 'dynamic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                                                  }`}>
                                                    {s.type === 'dynamic' ? '动' : '静'}
                                                  </span>
                                                  <span className="flex-1 text-gray-700">{s.name}</span>
                                                  {s.hasAssistant && (
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">小助手</span>
                                                  )}
                                                  <span className="text-xs text-gray-400">{s.duration}分钟</span>
                                                </label>
                                              );
                                            })
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400 mb-2">暂无纵向备课方案</p>
                                      )}

                                      {/* Selected steps display */}
                                      {selectedSteps.length > 0 && (
                                        <div className="space-y-1 mb-2">
                                          {selectedSteps.map(s => (
                                            <div key={s.id} className="p-2 bg-gray-50 rounded text-sm">
                                              <div className="flex items-center gap-1">
                                                <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                                  s.type === 'dynamic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                  {s.type === 'dynamic' ? '动' : '静'}
                                                </span>
                                                <span className="text-gray-900">{s.name}</span>
                                                {s.hasAssistant && (
                                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">小助手</span>
                                                )}
                                                <span className="text-xs text-gray-400 ml-auto">{s.duration}分钟</span>
                                              </div>
                                              {s.detail && <p className="text-xs text-gray-500 mt-1">{s.detail}</p>}
                                              {s.materials && <p className="text-xs text-gray-400 mt-0.5">教具：{s.materials}</p>}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Blackboard input */}
                                      <textarea
                                        rows={2}
                                        value={gs?.blackboard || ''}
                                        onChange={(e) => handleGradeStepBlackboard(step.id, track.gradeId, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder={`${track.gradeName}板书（可选）`}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="space-y-3 mt-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">互动名称</label>
                                  <input
                                    type="text"
                                    value={step.crossGradeStep.name}
                                    onChange={(e) => handleCrossGradeChange(step.id, 'name', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="互动名称"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">互动内容</label>
                                  <textarea
                                    rows={2}
                                    value={step.crossGradeStep.content}
                                    onChange={(e) => handleCrossGradeChange(step.id, 'content', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="互动内容描述"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">教具/材料</label>
                                  <input
                                    type="text"
                                    value={step.crossGradeStep.materials}
                                    onChange={(e) => handleCrossGradeChange(step.id, 'materials', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="所需教具"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={step.crossGradeStep.hasAssistant}
                                    onChange={(e) => handleCrossGradeChange(step.id, 'hasAssistant', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600"
                                  />
                                  需要学生小助教协助
                                </label>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">板书</label>
                                  <textarea
                                    rows={2}
                                    value={step.crossGradeStep.blackboard}
                                    onChange={(e) => handleCrossGradeChange(step.id, 'blackboard', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="互动板书内容"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                  />
                                </div>
                              </div>
                            )}
                            {/* Bottom action buttons */}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('确定要删除此教学步骤吗？')) {
                                    handleRemoveStep(step.id);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                              >
                                删除
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleStepExpanded(step.id); }}
                                className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg"
                              >
                                收起
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Homework section */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-bold text-gray-700 mb-4">作业布置</h2>
              <div className="space-y-3">
                {tracks.map(track => {
                  const hw = homework.find(h => h.gradeId === track.gradeId);
                  return (
                    <div key={track.gradeId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{track.gradeName}</span>
                        <span className="text-xs text-gray-500">{track.subjectName}</span>
                      </div>
                      <textarea
                        rows={3}
                        value={hw?.content || ''}
                        onChange={(e) => handleHomeworkChange(track.gradeId, e.target.value)}
                        placeholder={`${track.gradeName}作业内容，每行一条`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom save button */}
      {currentStep === 2 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存教案'}
          </button>
        </div>
      )}

      {/* Lesson picker modal */}
      {lessonPickerTrackIndex !== null && tracks[lessonPickerTrackIndex] && (
        <LessonPicker
          visible={true}
          subjectId={tracks[lessonPickerTrackIndex].subjectId}
          gradeId={tracks[lessonPickerTrackIndex].gradeId}
          version={tracks[lessonPickerTrackIndex].version}
          volume={tracks[lessonPickerTrackIndex].volume}
          lessonPlans={allLessonPlans}
          selectedTitles={tracks[lessonPickerTrackIndex].units}
          onSelect={(plan) => handleSelectLesson(lessonPickerTrackIndex, plan)}
          onRemove={(title) => handleRemoveLesson(lessonPickerTrackIndex, title)}
          onClose={() => setLessonPickerTrackIndex(null)}
        />
      )}

      {/* Version picker modal */}
      {versionPickerTrackIndex !== null && tracks[versionPickerTrackIndex] && (
        <VersionPickerModal
          versions={getAvailableVersions(versionPickerTrackIndex)}
          selectedVersion={tracks[versionPickerTrackIndex].version}
          onSelect={(version) => {
            // Auto-fill volume: only one → use it, multiple → use latest
            const track = tracks[versionPickerTrackIndex];
            const config = curriculumConfigs.find(c =>
              c.subjectId === track.subjectId && c.gradeId === track.gradeId && c.version === version
            );
            const volume = config?.volumes && config.volumes.length > 0
              ? config.volumes[config.volumes.length - 1]
              : '';
            updateTrack(versionPickerTrackIndex, { version, volume });
            setVersionPickerTrackIndex(null);
          }}
          onClose={() => setVersionPickerTrackIndex(null)}
        />
      )}

      {/* Volume picker modal */}
      {volumePickerTrackIndex !== null && tracks[volumePickerTrackIndex] && (
        <VolumePickerModal
          volumes={getAvailableVolumes(volumePickerTrackIndex)}
          selectedVolume={tracks[volumePickerTrackIndex].volume}
          onSelect={(volume) => {
            updateTrack(volumePickerTrackIndex, { volume });
            setVolumePickerTrackIndex(null);
          }}
          onClose={() => setVolumePickerTrackIndex(null)}
        />
      )}

      {/* Subject picker modal */}
      {subjectPickerTrackIndex !== null && (
        <SubjectPickerModal
          subjects={subjects}
          selectedSubjectId={tracks[subjectPickerTrackIndex]?.subjectId || ''}
          onSelect={(subjectId) => {
            handleSubjectChange(subjectPickerTrackIndex, subjectId);
            setSubjectPickerTrackIndex(null);
          }}
          onClose={() => setSubjectPickerTrackIndex(null)}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default HorizontalPlanEdit;
