export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id:            number;
  name:          string;
  email:         string;
  profile_image: string | null;
  created_at:    Date;
}

export interface Task {
  id:          number;
  title:       string;
  description: string | null;
  status:      TaskStatus;
  assigned_to: number | null;
  created_by:  number;
  created_at:  Date;
  updated_at:  Date;
  assignee?:   { id: number; name: string; profile_image: string | null } | null;
  creator?:    { id: number; name: string; profile_image: string | null };
}

export interface JwtPayload {
  userId: number;
  email:  string;
}

export type WsEventType = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';

export interface WsEvent {
  type:    WsEventType;
  payload: Task | { id: number };
}