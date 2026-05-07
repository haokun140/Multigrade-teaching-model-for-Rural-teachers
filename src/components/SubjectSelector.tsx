import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { GRADE_TEXT_TO_ID, GRADE_ID_TO_LABEL } from '../lib/grades';

interface SubjectSelectorProps {
  subjects: Array<{ id: string; name: string }>;
  value: {
    subjectId: string;
    version: string;
    gradeId: string;
    volume: string;
  };
  onChange: (value: {
    subjectId: string;
    version: string;
    gradeId: string;
    volume: string;
  }) => void;
  stage?: string;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ subjects, value, onChange, stage }) => {
  const [expanded, setExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [availableGradeIds, setAvailableGradeIds] = useState<string[]>([]);
  const [availableVolumes, setAvailableVolumes] = useState<string[]>([]);

  const subjectName = subjects.find(s => s.id === localValue.subjectId)?.name;

  const fetchVersions = async (subject: string) => {
    try {
      const res = await api.getTextbookVersions(subject, stage);
      if (res.success && res.data) {
        setAvailableVersions(res.data);
        return res.data;
      }
    } catch { /* ignore */ }
    return [];
  };

  const fetchGrades = async (subject: string, version: string) => {
    try {
      const res = await api.getTextbookGrades(subject, version, stage);
      if (res.success && res.data) {
        const ids = res.data.map((g: string) => GRADE_TEXT_TO_ID[g]).filter(Boolean);
        setAvailableGradeIds(ids);
        return ids;
      }
    } catch { /* ignore */ }
    return [];
  };

  const fetchVolumes = async (subject: string, version: string, gradeLabel: string) => {
    try {
      const res = await api.getTextbookVolumes(subject, version, gradeLabel, stage);
      if (res.success && res.data) {
        setAvailableVolumes(res.data);
        return res.data;
      }
    } catch { /* ignore */ }
    return [];
  };

  const handleSubjectChange = async (subjectId: string) => {
    const name = subjects.find(s => s.id === subjectId)?.name;
    const versions = name ? await fetchVersions(name) : [];
    const newVersion = versions.length > 0 ? versions[0] : '';
    const newValue = {
      subjectId,
      version: newVersion,
      gradeId: '',
      volume: ''
    };
    setLocalValue(newValue);
    onChange(newValue);

    if (newVersion && name) {
      const grades = await fetchGrades(name, newVersion);
      const firstGradeId = grades.length > 0 ? grades[0] : '';
      if (firstGradeId) {
        const gradeLabel = GRADE_ID_TO_LABEL[firstGradeId] || firstGradeId;
        const vols = await fetchVolumes(name, newVersion, gradeLabel);
        const v: typeof newValue = { ...newValue, gradeId: firstGradeId, volume: vols.length > 0 ? vols[0] : '' };
        setLocalValue(v);
        onChange(v);
      }
    }
  };

  const handleVersionChange = async (version: string) => {
    const name = subjects.find(s => s.id === localValue.subjectId)?.name;
    const newValue = { ...localValue, version, gradeId: '', volume: '' };
    setLocalValue(newValue);
    onChange(newValue);

    if (name && version) {
      const grades = await fetchGrades(name, version);
      const firstGradeId = grades.length > 0 ? grades[0] : '';
      if (firstGradeId) {
        const gradeLabel = GRADE_ID_TO_LABEL[firstGradeId] || firstGradeId;
        const vols = await fetchVolumes(name, version, gradeLabel);
        const v: typeof newValue = { ...newValue, gradeId: firstGradeId, volume: vols.length > 0 ? vols[0] : '' };
        setLocalValue(v);
        onChange(v);
      }
    }
  };

  const handleGradeChange = async (gradeId: string) => {
    const name = subjects.find(s => s.id === localValue.subjectId)?.name;
    const gradeLabel = GRADE_ID_TO_LABEL[gradeId] || gradeId;
    const vols = name && localValue.version ? await fetchVolumes(name, localValue.version, gradeLabel) : [];
    const newValue = { ...localValue, gradeId, volume: vols.length > 0 ? vols[0] : '' };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleVolumeChange = (volume: string) => {
    const newValue = { ...localValue, volume };
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">
              {subjectName || '请选择学科'}
            </div>
            <div className="text-xs text-gray-500">
              {localValue.version && localValue.gradeId && localValue.volume
                ? `${localValue.version} · ${localValue.volume}`
                : '请完成选择'}
            </div>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
        </button>

        {expanded && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学科</label>
              <select
                value={localValue.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择学科</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            {subjectName && availableVersions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">版本</label>
                <select
                  value={localValue.version}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择版本</option>
                  {availableVersions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>
            )}

            {subjectName && localValue.version && availableGradeIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年级</label>
                <select
                  value={localValue.gradeId}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择年级</option>
                  {availableGradeIds.map(gradeId => (
                    <option key={gradeId} value={gradeId}>
                      {GRADE_ID_TO_LABEL[gradeId] || gradeId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableVolumes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">册次</label>
                <select
                  value={localValue.volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择册次</option>
                  {availableVolumes.map(volume => (
                    <option key={volume} value={volume}>{volume}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectSelector;
