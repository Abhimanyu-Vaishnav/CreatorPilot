export interface Project {
  id: number;
  owner: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Paused';
  color: string;
  icon: string;
  template: string;
  favorite: boolean;
  archived: boolean;
  project_progress: number;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  category?: string;
  status?: 'Planning' | 'In Progress' | 'Completed' | 'Paused';
  color?: string;
  icon?: string;
  template?: string;
  favorite?: boolean;
  archived?: boolean;
  project_progress?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  slug?: string;
}

export interface ProjectsFilterParams {
  category?: string;
  status?: string;
  favorite?: boolean;
  archived?: boolean;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectActivity {
  id: number;
  project: number;
  project_title: string;
  project_slug: string;
  user: number;
  username: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
  relative_time: string;
}

export interface ProjectOverviewData {
  project: Project;
  recent_activities: ProjectActivity[];
  statistics: {
    total_activities: number;
    age_days: number;
    notes_count: number;
    tasks_count: number;
    media_count: number;
    knowledge_count: number;
  };
}

