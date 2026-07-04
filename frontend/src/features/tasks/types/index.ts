import { Project } from "../../projects/types";
import { Note } from "../../notes/types";
import { KnowledgeItem } from "../../vault/types";

export type TaskStatus = "Todo" | "In Progress" | "Blocked" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: number;
  owner: number;
  owner_email: string;
  project: number;
  project_slug: string;
  project_title: string;
  related_note: number | null;
  note_title: string | null;
  note_slug: string | null;
  related_knowledge: number | null;
  knowledge_title: string | null;
  knowledge_slug: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  start_date: string | null;
  estimated_time: number; // in minutes
  completed_at: string | null;
  favorite: boolean;
  archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  project: number;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  start_date?: string | null;
  estimated_time?: number;
  related_note?: number | null;
  related_knowledge?: number | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  start_date?: string | null;
  estimated_time?: number;
  related_note?: number | null;
  related_knowledge?: number | null;
  favorite?: boolean;
  archived?: boolean;
  position?: number;
}

export interface TasksFilterParams {
  project?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  favorite?: boolean;
  archived?: boolean;
  search?: string;
  ordering?: string;
  due_today?: boolean;
  overdue?: boolean;
}
