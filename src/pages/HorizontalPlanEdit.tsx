import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, AlertTriangle, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../api';
import { Class as ClassType, Subject, LessonPlan } from '../types';
import BottomNav from '../components/BottomNav';

const HorizontalPlanEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(45);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

  const [tracks, setTracks] = useState<Array<{
    gradeId: string;
    subjectId: string;
    lessonPlanId?: string;
    blocks: Array<{
      id: string;
      name: string;
      type: 'dynamic' | 'static';
      start: number;
      duration: number;
    }>;
  }>>([]);

  const [interactions, setInteractions] = useState<Array<{
    id: string;
    name: string;
    description: string;
    start: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
      ]);

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      if (classesRes.data && classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0].id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectById = (subjectId: string) => subjects.find(s => s.id === subjectId);
  const getLessonPlanById = (planId: string) => lessonPlans.find(p => p.id === planId);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      const newTracks = cls.gradeIds.map(gradeId => ({
        gradeId,
        subjectId: '',
        blocks: [],
      }));
      setTracks(newTracks);
    }
  };

  const handleSubjectChange = (trackIndex: number, subjectId: string) => {
    const newTracks = [...tracks];
    newTracks[trackIndex].subjectId = subjectId;
    // 查找对应的纵向备课方案
    const track = newTracks[trackIndex];
    const matchingPlan = lessonPlans.find(
      p => p.subjectId === subjectId && p.gradeId === track.gradeId
    );
    if (matchingPlan) {
      newTracks[trackIndex].lessonPlanId = matchingPlan.id;
      // 自动填充教学步骤
      let currentStart = 0;
      newTracks[trackIndex].blocks = matchingPlan.steps.map((step, idx) => {
        const block = {
          id: `block-${Date.now()}-${idx}`,
          name: step.name,
          type: step.type,
          start: currentStart,
          duration: step.duration,
        };
        currentStart += step.duration;
        return block;
      });
    }
    setTracks(newTracks);
    checkConflicts(newTracks);
  };

  const checkConflicts = (currentTracks: typeof tracks) => {
    const newConflicts: string[] = [];
    // 检查所有动态步骤是否重叠
    const dynamicBlocks = currentTracks.flatMap(track =>
      track.blocks.filter(b => b.type === 'dynamic').map(b => ({
        ...b,
        gradeId: track.gradeId,
      }))
    );

    for (let i = 0; i < dynamicBlocks.length; i++) {
      for (let j = i + 1; j < dynamicBlocks.length; j++) {
        const a = dynamicBlocks[i];
        const b = dynamicBlocks[j];
        if (
          (a.start < b.start + b.duration) &&
          (b.start < a.start + a.duration)
        ) {
          const gradeA = GRADES[parseInt(a.gradeId) - 1];
          const gradeB = GRADES[parseInt(b.gradeId) - 1];
          newConflicts.push(`${gradeA} 和 ${gradeB} 的直接教学时间重叠，请调整`);
        }
      }
    }

    setConflicts(newConflicts);
  };

  const getTrackDuration = (track: typeof tracks[0]) => {
    return track.blocks.reduce((sum, block) => sum + block.duration, 0);
  };

  const handleSave = async () => {
    // 保存横向备课方案的逻辑
    alert('横向备课方案已保存！');
    navigate('/');
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
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">横向备课</h1>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>检测到动静冲突</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {conflicts.map((conflict, idx) => (
                <li key={idx}>• {conflict}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">选择班级</h2>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择班级</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.type === 'composite' ? '(复式班)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">课时设置</h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">课时时长：</span>
            <select
              value={lessonDuration}
              onChange={(e) => setLessonDuration(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={40}>40分钟</option>
              <option value={45}>45分钟</option>
              <option value={50}>50分钟</option>
            </select>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">各年级安排</h2>
            <div className="space-y-4">
              {tracks.map((track, trackIndex) => {
                const trackDuration = getTrackDuration(track);
                return (
                  <div key={trackIndex} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">
                        {GRADES[parseInt(track.gradeId) - 1]}
                      </span>
                      <span className={`text-sm ${trackDuration !== lessonDuration ? 'text-yellow-600' : 'text-green-600'}`}>
                        {trackDuration}分钟 / {lessonDuration}分钟
                      </span>
                    </div>
                    <div className="space-y-3">
                      <select
                        value={track.subjectId}
                        onChange={(e) => handleSubjectChange(trackIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">请选择学科</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>

                      {track.blocks.length > 0 && (
                        <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {/* 时间刻度 */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: Math.ceil(lessonDuration / 5) }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 border-r border-gray-200 flex items-end justify-center"
                              >
                                {i % 3 === 0 && (
                                  <span className="text-xs text-gray-400 pb-1">{i * 5}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* 步骤块 */}
                          {track.blocks.map((block) => (
                            <div
                              key={block.id}
                              className={`absolute top-2 bottom-2 rounded ${
                                block.type === 'dynamic' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              style={{
                                left: `${(block.start / lessonDuration) * 100}%`,
                                width: `${(block.duration / lessonDuration) * 100}%`,
                              }}
                            >
                              <div className="h-full flex items-center justify-center px-1">
                                <span className="text-xs text-white truncate">{block.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {track.blocks.length > 0 && (
                        <div className="space-y-2">
                          {track.blocks.map((block) => (
                            <div
                              key={block.id}
                              className={`flex items-center justify-between p-2 rounded border ${
                                block.type === 'dynamic'
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  block.type === 'dynamic' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}></span>
                                <span className="text-sm text-gray-700">{block.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">{block.duration}分钟</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tracks.length === 0 && selectedClass && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">请选择包含年级的班级</h3>
              <p className="text-gray-500">该班级没有配置包含的年级，请在设置中编辑</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HorizontalPlanEdit;
