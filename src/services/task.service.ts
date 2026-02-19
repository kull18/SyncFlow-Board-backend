import { pool } from '../config/database';
import { broadcast } from '../config/websocket';
import { TaskStatus } from '../types';

const TASK_WITH_USERS = `
  SELECT
    t.*,
    a.id AS assignee_id, a.name AS assignee_name, a.profile_image AS assignee_image,
    c.id AS creator_id,  c.name AS creator_name,  c.profile_image AS creator_image
  FROM tasks t
  LEFT JOIN users a ON t.assigned_to = a.id
  LEFT JOIN users c ON t.created_by  = c.id
`;

const mapTask = (row: any) => ({
  id:          row.id,
  title:       row.title,
  description: row.description,
  status:      row.status,
  assigned_to: row.assigned_to,
  created_by:  row.created_by,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
  assignee: row.assignee_id
    ? { id: row.assignee_id, name: row.assignee_name, profile_image: row.assignee_image }
    : null,
  creator: { id: row.creator_id, name: row.creator_name, profile_image: row.creator_image },
});

export const getAllTasks = async () => {
  const [rows]: any = await pool.query(`${TASK_WITH_USERS} ORDER BY t.created_at DESC`);
  return rows.map(mapTask);
};

export const createTask = async (
  title: string,
  description: string | null,
  assignedTo: number | null,
  createdBy: number
) => {
  const [result]: any = await pool.query(
    'INSERT INTO tasks (title, description, assigned_to, created_by) VALUES (?, ?, ?, ?)',
    [title, description, assignedTo, createdBy]
  );

  const [rows]: any = await pool.query(`${TASK_WITH_USERS} WHERE t.id = ?`, [result.insertId]);
  const task = mapTask(rows[0]);

  broadcast({ type: 'TASK_CREATED', payload: task });
  return task;
};

export const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
  await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);

  const [rows]: any = await pool.query(`${TASK_WITH_USERS} WHERE t.id = ?`, [taskId]);
  if (rows.length === 0) throw new Error('TASK_NOT_FOUND');

  const task = mapTask(rows[0]);
  broadcast({ type: 'TASK_UPDATED', payload: task });
  return task;
};

export const deleteTask = async (taskId: number) => {
  const [rows]: any = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
  if (rows.length === 0) throw new Error('TASK_NOT_FOUND');

  await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
  broadcast({ type: 'TASK_DELETED', payload: { id: taskId } });
};