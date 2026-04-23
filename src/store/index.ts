import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, School, Class, Subject, LessonPlan, HorizontalPlan } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface AppState {
  school: School | null;
  classes: Class[];
  subjects: Subject[];
  currentClass: Class | null;
  lessonPlans: LessonPlan[];
  horizontalPlans: HorizontalPlan[];
  setSchool: (school: School) => void;
  setClasses: (classes: Class[]) => void;
  setSubjects: (subjects: Subject[]) => void;
  setCurrentClass: (cls: Class) => void;
  addLessonPlan: (plan: LessonPlan) => void;
  updateLessonPlan: (id: string, plan: Partial<LessonPlan>) => void;
  removeLessonPlan: (id: string) => void;
  setLessonPlans: (plans: LessonPlan[]) => void;
  addHorizontalPlan: (plan: HorizontalPlan) => void;
  updateHorizontalPlan: (id: string, plan: Partial<HorizontalPlan>) => void;
  removeHorizontalPlan: (id: string) => void;
  setHorizontalPlans: (plans: HorizontalPlan[]) => void;
  resetApp: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        }))
    }),
    {
      name: 'auth-storage'
    }
  )
);

export const useAppStore = create<AppState>()((set) => ({
  school: null,
  classes: [],
  subjects: [],
  currentClass: null,
  lessonPlans: [],
  horizontalPlans: [],
  
  setSchool: (school) => set({ school }),
  setClasses: (classes) => set({ classes }),
  setSubjects: (subjects) => set({ subjects }),
  setCurrentClass: (cls) => set({ currentClass: cls }),
  
  addLessonPlan: (plan) => set((state) => ({
    lessonPlans: [...state.lessonPlans, plan]
  })),
  
  updateLessonPlan: (id, plan) => set((state) => ({
    lessonPlans: state.lessonPlans.map((p) =>
      p.id === id ? { ...p, ...plan } : p
    )
  })),
  
  removeLessonPlan: (id) => set((state) => ({
    lessonPlans: state.lessonPlans.filter((p) => p.id !== id)
  })),
  
  setLessonPlans: (plans) => set({ lessonPlans: plans }),
  
  addHorizontalPlan: (plan) => set((state) => ({
    horizontalPlans: [...state.horizontalPlans, plan]
  })),
  
  updateHorizontalPlan: (id, plan) => set((state) => ({
    horizontalPlans: state.horizontalPlans.map((p) =>
      p.id === id ? { ...p, ...plan } : p
    )
  })),
  
  removeHorizontalPlan: (id) => set((state) => ({
    horizontalPlans: state.horizontalPlans.filter((p) => p.id !== id)
  })),
  
  setHorizontalPlans: (plans) => set({ horizontalPlans: plans }),
  
  resetApp: () => set({
    school: null,
    classes: [],
    subjects: [],
    currentClass: null,
    lessonPlans: [],
    horizontalPlans: []
  })
}));
