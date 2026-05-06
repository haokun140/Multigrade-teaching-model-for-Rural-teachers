import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Subject, LessonStep } from '../types';

interface Track {
  gradeId: number;
  gradeName: string;
  subjectId: string;
  subjectName?: string;
  version: string;
  volume: string;
  units: string[];
  lessonPlans?: any[];
}

interface TeachingStep {
  id: string;
  type: 'dynamic-static' | 'cross-grade';
  duration: number;
  gradeSteps: Array<{
    gradeId: number;
    selectedStepIds: string[];
    selectedSteps: LessonStep[];
    blackboard?: string;
  }>;
  crossGradeStep: {
    gradeSubjects: Array<{ gradeId: number; subjectId: string; version: string; volume: string }>;
    name: string;
    content: string;
    materials: string;
    hasAssistant: boolean;
    blackboard?: string;
  };
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

const HorizontalPlanPreview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [teachingSteps, setTeachingSteps] = useState<TeachingStep[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(45);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);

  const [homework, setHomework] = useState<Array<{ gradeId: number; content: string }>>([]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  useEffect(() => {
    const tid = searchParams.get('timetableId');
    if (tid) {
      loadPlanData(tid);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const loadPlanData = async (tid: string) => {
    try {
      const planRes = await api.getHorizontalPlanByTimetable(tid);
      if (planRes.data) {
        const plan = planRes.data;
        setSelectedClass(plan.classId);
        setLessonDuration(plan.lessonDuration || 45);

        const date = searchParams.get('date');
        const time = searchParams.get('time');
        const duration = searchParams.get('duration');
        const dowStr = searchParams.get('dayOfWeek');
        if (date) setSelectedDate(date);
        if (time) setSelectedTime(decodeURIComponent(time));
        if (duration) setLessonDuration(parseInt(duration) || 45);
        if (dowStr) setDayOfWeek(parseInt(dowStr));

        if (plan.tracks && plan.tracks.length > 0) {
          const restoredTracks: Track[] = plan.tracks.map((t: any) => ({
            gradeId: t.gradeId,
            gradeName: t.gradeName || GRADES[t.gradeId - 1],
            subjectId: t.subjectId,
            subjectName: t.subjectName || '',
            version: t.version || '',
            volume: t.volume || '',
            units: t.units || [],
            lessonPlans: t.lessonPlans,
          }));
          setTracks(restoredTracks);
        }

        if (plan.interactions && plan.interactions.length > 0) {
          const restoredSteps: TeachingStep[] = plan.interactions.map((interaction: any, index: number) => ({
            id: `step-${index}`,
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

        if (plan.homework && Array.isArray(plan.homework)) {
          setHomework(plan.homework);
        }
      }
    } catch (e) {
      console.error('加载横向备课失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = (): string => {
    const cls = classes.find(c => c.id === selectedClass);
    const className = cls?.name || '';
    const majorDivider = '========================================';
    const minorDivider = '----------------------------------------';

    let md = '';

    // Header
    const previewDate = selectedDate || (dayOfWeek ? formatDateFromDayOfWeek(dayOfWeek) : '待定');
    const parsedTime = parseTimeFromPeriodInfo(selectedTime || null);
    const previewTime = parsedTime ? `${parsedTime.timeRange}（${parsedTime.periodName}）` : (selectedTime || '待定');
    md += `${majorDivider}\n`;
    md += `日期：${previewDate}  时间：${previewTime}\n`;
    md += `班级：${className}${cls?.type === 'composite' ? '复式班' : ''}\n`;
    md += `${majorDivider}\n\n`;

    // Track info
    tracks.forEach(track => {
      const unitNames = track.units.join('、');
      md += `--- ${track.gradeName}·${track.subjectName || '未选学科'}（${track.version || '未选版本'} ${track.volume || '未选册次'}）---\n`;
      md += `课题：《${unitNames || '未选课题'}》\n`;
      md += `教学目标：\n`;

      const plans = track.lessonPlans || [];
      if (plans.length > 0 && plans[0].objectives && plans[0].objectives.length > 0) {
        plans[0].objectives.forEach((obj: any, i: number) => {
          const text = typeof obj === 'string' ? obj : (obj.content || '');
          md += `  ${i + 1}. ${text}\n`;
        });
      } else {
        md += `  1. [填写${track.gradeName}核心目标1]\n`;
        md += `  2. [填写${track.gradeName}核心目标2]\n`;
      }
      md += `\n`;
    });

    md += `${minorDivider}\n\n`;

    // Teaching steps
    let cumulativeTime = 0;
    teachingSteps.forEach((step, stepIdx) => {
      if (stepIdx > 0) {
        md += `\n${minorDivider}\n\n`;
      }

      const startTime = cumulativeTime;
      cumulativeTime += step.duration;
      const endTime = cumulativeTime;

      const typeLabel = step.type === 'dynamic-static' ? '动 + 静' : '跨年级互动';
      md += `[${startTime}－${endTime} min] ${typeLabel}\n\n`;

      if (step.type === 'dynamic-static') {
        tracks.forEach(track => {
          const gradeStep = step.gradeSteps.find(gs => gs.gradeId === track.gradeId);
          const selectedSteps = gradeStep?.selectedSteps || [];

          const hasDynamic = selectedSteps.some(s => s.type === 'dynamic');
          const modeLabel = hasDynamic ? '直接教学' : '自主练';

          md += `> ${track.gradeName}${track.subjectName || ''} | ${modeLabel}\n`;

          if (selectedSteps.length > 0) {
            selectedSteps.forEach((s, sIdx) => {
              let stepText = `${s.name}`;
              if (s.detail) stepText += `，${s.detail}`;

              let line = `  ${sIdx + 1}. ${stepText}（${s.duration} min）`;
              if (s.hasAssistant) line += '【助教】';
              if (s.materials) line += `【教具：${s.materials}】`;

              md += `${line}\n`;
            });
          } else {
            md += `  （未选择步骤）\n`;
          }
          md += `\n`;
        });

        tracks.forEach(track => {
          const gradeStep = step.gradeSteps.find(gs => gs.gradeId === track.gradeId);
          const blackboard = gradeStep?.blackboard || '（无）';
          md += `板书（${track.gradeName}）：${blackboard}\n`;
        });

      } else {
        md += '跨年级互动：\n';
        const cg = step.crossGradeStep;
        if (cg.name || cg.content) {
          const stepText = cg.name + (cg.content ? `，${cg.content}` : '');
          let line = `  1. ${stepText}（${step.duration} min）`;
          if (cg.hasAssistant) line += '【助教】';
          if (cg.materials) line += `【教具：${cg.materials}】`;
          md += `${line}\n`;
        } else {
          md += '  （未填写互动内容）\n';
        }
        md += '\n';

        const cgBlackboard = cg.blackboard || '（无）';
        md += `互动板书：${cgBlackboard}\n`;
      }
    });

    // Homework
    const hasHomework = homework.some(h => h.content && h.content.trim());
    if (hasHomework) {
      md += `\n\n${majorDivider}\n`;
      md += '课后作业\n';
      md += `${majorDivider}\n\n`;

      tracks.forEach(track => {
        const hw = homework.find(h => h.gradeId === track.gradeId);
        if (hw?.content) {
          const lines = hw.content.split('\n').filter(l => l.trim());
          md += `${track.gradeName}·${track.subjectName || ''}：\n`;
          lines.forEach((line, i) => {
            md += `  ${i + 1}. ${line}\n`;
          });
          md += '\n';
        }
      });
    }

    return md.trimEnd();
  };

  const handleCopy = async () => {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const markdown = generateMarkdown();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">教案预览</h1>
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
            {markdown}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default HorizontalPlanPreview;
