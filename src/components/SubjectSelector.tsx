import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// 学科配置数据
const SUBJECT_CONFIG = {
  '语文': {
    versions: ['人教版', '北师大版', '苏教版', '部编版'],
    grades: {
      '1': ['上册', '下册'],
      '2': ['上册', '下册'],
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '数学': {
    versions: ['人教版', '北师大版', '苏教版', '浙教版'],
    grades: {
      '1': ['上册', '下册'],
      '2': ['上册', '下册'],
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '英语': {
    versions: ['人教版', '外研版', '牛津版', '译林版'],
    grades: {
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '科学': {
    versions: ['人教版', '北师大版', '苏教版'],
    grades: {
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '道德与法治': {
    versions: ['人教版', '部编版'],
    grades: {
      '1': ['上册', '下册'],
      '2': ['上册', '下册'],
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '音乐': {
    versions: ['人教版', '人音版'],
    grades: {
      '1': ['上册', '下册'],
      '2': ['上册', '下册'],
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '美术': {
    versions: ['人教版', '人美版'],
    grades: {
      '1': ['上册', '下册'],
      '2': ['上册', '下册'],
      '3': ['上册', '下册'],
      '4': ['上册', '下册'],
      '5': ['上册', '下册'],
      '6': ['上册', '下册']
    }
  },
  '体育': {
    versions: ['人教版'],
    grades: {
      '1': ['全册'],
      '2': ['全册'],
      '3': ['全册'],
      '4': ['全册'],
      '5': ['全册'],
      '6': ['全册']
    }
  }
};

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
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ subjects, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  // 从localStorage加载保存的配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('subjectConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config[value.subjectId]) {
          setLocalValue(prev => ({
            ...prev,
            version: config[value.subjectId].version || prev.version,
            volume: config[value.subjectId].volumes?.[value.gradeId] || prev.volume
          }));
        }
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, [value.subjectId, value.gradeId]);

  const handleSubjectChange = (subjectId: string) => {
    const subjectName = subjects.find(s => s.id === subjectId)?.name;
    const newVersion = subjectName && SUBJECT_CONFIG[subjectName] ? SUBJECT_CONFIG[subjectName].versions[0] : '';
    const newValue = {
      subjectId,
      version: newVersion,
      gradeId: value.gradeId,
      volume: ''
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleVersionChange = (version: string) => {
    const subjectName = subjects.find(s => s.id === localValue.subjectId)?.name;
    const newValue = {
      ...localValue,
      version
    };
    setLocalValue(newValue);
    onChange(newValue);
    
    // 保存版本选择
    const savedConfig = localStorage.getItem('subjectConfig');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    config[localValue.subjectId] = {
      version
    };
    localStorage.setItem('subjectConfig', JSON.stringify(config));
  };

  const handleGradeChange = (gradeId: string) => {
    const subjectName = subjects.find(s => s.id === localValue.subjectId)?.name;
    const volumes = subjectName && SUBJECT_CONFIG[subjectName]?.grades[gradeId] || [];
    const newVolume = volumes.length > 0 ? volumes[0] : '';
    const newValue = {
      ...localValue,
      gradeId,
      volume: newVolume
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleVolumeChange = (volume: string) => {
    const newValue = {
      ...localValue,
      volume
    };
    setLocalValue(newValue);
    onChange(newValue);
    
    // 保存册次选择
    const savedConfig = localStorage.getItem('subjectConfig');
    const config = savedConfig ? JSON.parse(savedConfig) : {};
    if (!config[localValue.subjectId]) {
      config[localValue.subjectId] = {};
    }
    if (!config[localValue.subjectId].volumes) {
      config[localValue.subjectId].volumes = {};
    }
    config[localValue.subjectId].volumes[localValue.gradeId] = volume;
    localStorage.setItem('subjectConfig', JSON.stringify(config));
  };

  const subjectName = subjects.find(s => s.id === localValue.subjectId)?.name;
  const currentSubjectConfig = subjectName ? SUBJECT_CONFIG[subjectName] : null;
  const grades = Object.keys(currentSubjectConfig?.grades || {});
  const volumes = currentSubjectConfig?.grades[localValue.gradeId] || [];

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学科
              </label>
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

            {currentSubjectConfig && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本
                </label>
                <select
                  value={localValue.version}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择版本</option>
                  {currentSubjectConfig.versions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>
            )}

            {currentSubjectConfig && grades.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年级
                </label>
                <select
                  value={localValue.gradeId}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择年级</option>
                  {grades.map(gradeId => (
                    <option key={gradeId} value={gradeId}>
                      {gradeId === '1' ? '一年级' :
                       gradeId === '2' ? '二年级' :
                       gradeId === '3' ? '三年级' :
                       gradeId === '4' ? '四年级' :
                       gradeId === '5' ? '五年级' : '六年级'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {volumes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  册次
                </label>
                <select
                  value={localValue.volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择册次</option>
                  {volumes.map(volume => (
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
