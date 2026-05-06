import type {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  School,
  CreateSchoolRequest,
  JoinSchoolRequest,
  Class,
  CreateClassRequest,
  Subject,
  TimetableEntry,
  CreateTimetableRequest,
  LessonPlan,
  CreateLessonPlanRequest,
  UpdateLessonPlanRequest,
  HorizontalPlan,
  CreateHorizontalPlanRequest,
  UpdateHorizontalPlanRequest,
  ProgressStats,
  ApiResponse,
  CurriculumConfig,
  CreateCurriculumConfigRequest
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://10.60.204.75:3001';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      }
    });

    return await response.json() as ApiResponse<T>;
  }

  // Auth endpoints
  async sendVerificationCode(phone: string): Promise<ApiResponse<any>> {
    return this.request('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const result: ApiResponse<AuthResponse> = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const result: ApiResponse<AuthResponse> = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request('/api/auth/me');
  }

  logout(): void {
    this.removeToken();
  }

  // School endpoints
  async createSchool(data: any): Promise<ApiResponse<AuthResponse>> {
    const result: ApiResponse<AuthResponse> = await this.request('/api/schools/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async joinSchool(data: JoinSchoolRequest): Promise<ApiResponse<AuthResponse>> {
    const result: ApiResponse<AuthResponse> = await this.request('/api/schools/join', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async getSchool(): Promise<ApiResponse<School>> {
    return this.request('/api/schools');
  }

  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    return this.request('/api/schools/subjects');
  }

  async getTimeConfigs(): Promise<ApiResponse<any[]>> {
    return this.request('/api/schools/time-configs');
  }

  async updateTimeConfigs(timeSlots: any[]): Promise<ApiResponse<any>> {
    return this.request('/api/schools/time-configs', {
      method: 'PUT',
      body: JSON.stringify({ timeSlots })
    });
  }

  // Curriculum Config endpoints
  async getCurriculumConfigs(subjectId?: string, gradeId?: number): Promise<ApiResponse<CurriculumConfig[]>> {
    const queryParams = new URLSearchParams();
    if (subjectId) queryParams.append('subjectId', subjectId);
    if (gradeId) queryParams.append('gradeId', gradeId.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/api/schools/curriculum-configs?${queryString}` 
      : '/api/schools/curriculum-configs';
      
    return this.request(endpoint);
  }

  async createCurriculumConfig(data: CreateCurriculumConfigRequest): Promise<ApiResponse<CurriculumConfig>> {
    return this.request('/api/schools/curriculum-configs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCurriculumConfig(id: string, data: Partial<CreateCurriculumConfigRequest>): Promise<ApiResponse<CurriculumConfig>> {
    return this.request(`/api/schools/curriculum-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCurriculumConfig(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/schools/curriculum-configs/${id}`, {
      method: 'DELETE'
    });
  }

  // Class endpoints
  async getClasses(): Promise<ApiResponse<Class[]>> {
    return this.request('/api/classes');
  }

  async createClass(data: CreateClassRequest): Promise<ApiResponse<Class>> {
    return this.request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateClass(id: string, data: Partial<CreateClassRequest>): Promise<ApiResponse<Class>> {
    return this.request(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteClass(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classes/${id}`, {
      method: 'DELETE'
    });
  }

  // Timetable endpoints
  async getTimetable(classId: string): Promise<ApiResponse<TimetableEntry[]>> {
    return this.request(`/api/timetables/${classId}`);
  }

  async setTimetableEntry(data: CreateTimetableRequest): Promise<ApiResponse<TimetableEntry>> {
    return this.request('/api/timetables', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteTimetableEntry(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/timetables/${id}`, {
      method: 'DELETE'
    });
  }

  async updateWeeklyTimetable(classId: string, entries: Array<{
    dayOfWeek: number;
    periodIndex: number;
    subjectId: string;
    lessonType: 'new' | 'review' | 'practice';
    gradeId?: number;
  }>): Promise<ApiResponse<TimetableEntry[]>> {
    return this.request(`/api/timetables/weekly/${classId}`, {
      method: 'PUT',
      body: JSON.stringify({ classId, entries })
    });
  }

  // Lesson Plan endpoints
  async getLessonPlans(classId: string, gradeId: number, subjectId: string): Promise<ApiResponse<LessonPlan[]>> {
    return this.request(`/api/lesson-plans?classId=${classId}&gradeId=${gradeId}&subjectId=${subjectId}`);
  }

  async getAllLessonPlans(): Promise<ApiResponse<LessonPlan[]>> {
    return this.request('/api/lesson-plans/all');
  }

  async getLessonPlan(id: string): Promise<ApiResponse<LessonPlan>> {
    return this.request(`/api/lesson-plans/${id}`);
  }

  async createLessonPlan(data: CreateLessonPlanRequest): Promise<ApiResponse<LessonPlan>> {
    return this.request('/api/lesson-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLessonPlan(id: string, data: UpdateLessonPlanRequest): Promise<ApiResponse<LessonPlan>> {
    return this.request(`/api/lesson-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteLessonPlan(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/lesson-plans/${id}`, {
      method: 'DELETE'
    });
  }

  async copyLessonPlan(id: string): Promise<ApiResponse<LessonPlan>> {
    return this.request(`/api/lesson-plans/${id}/copy`, {
      method: 'POST'
    });
  }

  // Horizontal Plan endpoints
  async getHorizontalPlanByTimetable(timetableId: string): Promise<ApiResponse<HorizontalPlan>> {
    return this.request(`/api/horizontal-plans/timetable/${timetableId}`);
  }

  async getHorizontalPlan(id: string): Promise<ApiResponse<HorizontalPlan>> {
    return this.request(`/api/horizontal-plans/${id}`);
  }

  async createHorizontalPlan(data: CreateHorizontalPlanRequest): Promise<ApiResponse<HorizontalPlan>> {
    return this.request('/api/horizontal-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateHorizontalPlan(id: string, data: UpdateHorizontalPlanRequest): Promise<ApiResponse<HorizontalPlan>> {
    return this.request(`/api/horizontal-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteHorizontalPlan(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/horizontal-plans/${id}`, {
      method: 'DELETE'
    });
  }

  // Progress endpoint
  async getProgress(): Promise<ApiResponse<ProgressStats>> {
    return this.request('/api/progress');
  }
}

export const api = new ApiClient();
