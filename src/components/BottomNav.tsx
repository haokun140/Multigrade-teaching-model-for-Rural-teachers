import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BookOpen, Users, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/timetable', label: '课程规划', icon: Calendar },
    { path: '/lesson-plans', label: '备课', icon: BookOpen },
    { path: '/classes', label: '班级', icon: Users },
    { path: '/settings', label: '设置', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
