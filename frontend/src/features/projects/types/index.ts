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
