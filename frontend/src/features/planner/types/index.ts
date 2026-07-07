export type CalendarEventType =
  | "Task"
  | "Milestone"
  | "Meeting"
  | "Content Plan"
  | "Reminder"
  | "Personal";

export interface CalendarEvent {
  id: string; // can be "task_123" or "event_123" (from backend) or just id
  owner: number;
  project?: number | null;
  project_slug?: string | null;
  project_title?: string | null;
  related_task?: number | null;
  task_title?: string | null;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  color: string;
  event_type: CalendarEventType;
  reminder_minutes: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  task_status?: string; // If event represents a task, this holds "Todo" | "In Progress" | "Blocked" | "Completed"
}

export interface CalendarFilterParams {
  start_date?: string;
  end_date?: string;
  start?: string;
  end?: string;
  project?: string; // project slug or ID
  event_type?: string;
  search?: string;
  today?: boolean;
  upcoming?: boolean;
  completed_tasks?: boolean;
  archived?: boolean;
}

export interface CreateEventInput {
  project?: number | null;
  related_task?: number | null;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day?: boolean;
  color?: string;
  event_type: CalendarEventType;
  reminder_minutes?: number;
  archived?: boolean;
}

export interface UpdateEventInput {
  project?: number | null;
  related_task?: number | null;
  title?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  all_day?: boolean;
  color?: string;
  event_type?: CalendarEventType;
  reminder_minutes?: number;
  task_status?: string; // used when updating a task-event's status
  archived?: boolean;
}
