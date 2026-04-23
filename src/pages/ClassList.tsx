import React from 'react';
import { Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const ClassList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              班级管理
            </h1>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              去设置
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="text-center py-12">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">班级管理已移至设置</h3>
            <p className="text-gray-500 mb-6">点击上方按钮前往设置页面管理班级</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              前往设置
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ClassList;
