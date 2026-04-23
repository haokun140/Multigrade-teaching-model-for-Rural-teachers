import React, { useState } from 'react';

interface TimeSlot {
  id: string;
  type: 'class' | 'self-study' | 'exercise' | 'morning-reading';
  startTime: string; // 格式: HH:MM
  endTime: string; // 格式: HH:MM
}

interface TimeTimelineProps {
  timeSlots: TimeSlot[];
  onTimeSlotsChange: (timeSlots: TimeSlot[]) => void;
}

const TIME_TYPES = [
  { value: 'morning-reading', label: '早读' },
  { value: 'class', label: '上课' },
  { value: 'self-study', label: '早/晚自习' },
  { value: 'exercise', label: '健身操' },
];

const TimeTimeline: React.FC<TimeTimelineProps> = ({ timeSlots, onTimeSlotsChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    id: Math.random().toString(36).substr(2, 9),
    type: 'class',
    startTime: '08:00',
    endTime: '08:45',
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddSlot = () => {
    setIsAdding(true);
    setEditingSlot(null);
    setNewSlot({
      id: Math.random().toString(36).substr(2, 9),
      type: 'class',
      startTime: '08:00',
      endTime: '08:45',
    });
    setError(null);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setNewSlot({ ...slot });
    setIsAdding(true);
    setError(null);
  };

  const handleDeleteSlot = (id: string) => {
    if (window.confirm('确定要删除这个时间段吗？')) {
      const updatedSlots = timeSlots.filter(slot => slot.id !== id);
      onTimeSlotsChange(updatedSlots);
    }
  };

  const handleSaveSlot = () => {
    // 验证时间格式
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlot.startTime) || !timeRegex.test(newSlot.endTime)) {
      setError('时间格式不正确，请使用 HH:MM 格式');
      return;
    }

    // 验证开始时间小于结束时间
    const startParts = newSlot.startTime.split(':').map(Number);
    const endParts = newSlot.endTime.split(':').map(Number);
    const startTime = startParts[0] * 60 + startParts[1];
    const endTime = endParts[0] * 60 + endParts[1];
    
    if (startTime >= endTime) {
      setError('开始时间必须早于结束时间');
      return;
    }

    // 检测时间重叠
    const overlappingSlot = timeSlots.find(slot => {
      if (editingSlot && slot.id === editingSlot.id) return false;
      
      const slotStartParts = slot.startTime.split(':').map(Number);
      const slotEndParts = slot.endTime.split(':').map(Number);
      const slotStartTime = slotStartParts[0] * 60 + slotStartParts[1];
      const slotEndTime = slotEndParts[0] * 60 + slotEndParts[1];

      return (startTime < slotEndTime && endTime > slotStartTime);
    });

    if (overlappingSlot) {
      setError('时间段与现有时间段重叠');
      return;
    }

    let updatedSlots;
    if (editingSlot) {
      updatedSlots = timeSlots.map(slot => 
        slot.id === editingSlot.id ? newSlot : slot
      );
    } else {
      updatedSlots = [...timeSlots, newSlot];
    }

    // 按开始时间排序
    updatedSlots.sort((a, b) => {
      const aParts = a.startTime.split(':').map(Number);
      const bParts = b.startTime.split(':').map(Number);
      return aParts[0] * 60 + aParts[1] - (bParts[0] * 60 + bParts[1]);
    });

    onTimeSlotsChange(updatedSlots);
    setIsAdding(false);
    setEditingSlot(null);
    setError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingSlot(null);
    setError(null);
  };

  const getTypeLabel = (type: string) => {
    const typeObj = TIME_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'morning-reading':
        return 'bg-blue-100 border-blue-300';
      case 'class':
        return 'bg-green-100 border-green-300';
      case 'self-study':
        return 'bg-yellow-100 border-yellow-300';
      case 'exercise':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">学校时间配置</h3>
        <button
          type="button"
          onClick={handleAddSlot}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加时间段
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {editingSlot ? '编辑时间段' : '添加时间段'}
          </h4>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                类型
              </label>
              <select
                value={newSlot.type}
                onChange={(e) => setNewSlot(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  开始时间
                </label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  结束时间
                </label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative border-l-2 border-gray-200 pl-6 space-y-6">
        {timeSlots.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            暂无时间配置，请点击"添加时间段"按钮添加
          </div>
        ) : (
          timeSlots.map((slot) => (
            <div
              key={slot.id}
              className="relative"
            >
              <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
              <div className={`p-3 rounded-lg border ${getTypeColor(slot.type)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{getTypeLabel(slot.type)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditSlot(slot)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimeTimeline;
export type { TimeSlot };