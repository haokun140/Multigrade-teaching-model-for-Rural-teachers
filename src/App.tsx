import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, useAppStore } from './store';
import { api } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SchoolSetup from './pages/SchoolSetup';
import Timetable from './pages/Timetable';
import ClassList from './pages/ClassList';
import CreateClass from './pages/CreateClass';
import LessonPlanList from './pages/LessonPlanList';
import LessonPlanEdit from './pages/LessonPlanEdit';
import HorizontalPlanEdit from './pages/HorizontalPlanEdit';
import LessonCard from './pages/LessonCard';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import CurriculumConfigManager from './pages/CurriculumConfigManager';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const SchoolRequiredRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const { school } = useAppStore();
  
  if (!user?.schoolId && !school) {
    return <Navigate to="/school/setup" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated, token, login, logout } = useAuthStore();
  const { setSchool, setSubjects, resetApp } = useAppStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && token) {
        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            // 如果用户有学校ID，尝试获取学校和学科数据
            if (response.data.schoolId) {
              try {
                const [schoolRes, subjectsRes] = await Promise.all([
                  api.getSchool(),
                  api.getSubjects()
                ]);
                if (schoolRes.success && schoolRes.data) {
                  setSchool(schoolRes.data);
                }
                if (subjectsRes.success && subjectsRes.data) {
                  setSubjects(subjectsRes.data);
                }
              } catch (e) {
                console.error('Failed to load initial data:', e);
              }
            }
          }
        } catch (e) {
          console.error('Auth check failed:', e);
          logout();
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, token, setSchool, setSubjects, logout]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/school/setup"
            element={
              <ProtectedRoute>
                <SchoolSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <Home />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <Timetable />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <ClassList />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-class"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <CreateClass />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson-plans"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <LessonPlanList />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson-plans/new"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <LessonPlanEdit />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson-plans/:id"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <LessonPlanEdit />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/horizontal-plans/new"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <HorizontalPlanEdit />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/horizontal-plans/:id"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <HorizontalPlanEdit />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson-cards/:id"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <LessonCard />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <Progress />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <Settings />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/curriculum-config"
            element={
              <ProtectedRoute>
                <SchoolRequiredRoute>
                  <CurriculumConfigManager />
                </SchoolRequiredRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
