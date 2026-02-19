import { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { TaskStatus } from '../types';

const VALID_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const getTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Error al obtener tareas' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const { title, description, assigned_to } = req.body;
  if (!title) { res.status(400).json({ message: 'El título es requerido' }); return; }
  try {
    const task = await taskService.createTask(
      title, description || null, assigned_to || null, req.user!.userId
    );
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Error al crear tarea' });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const taskId = Number(req.params.id);
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Estado inválido. Usa: TODO, IN_PROGRESS o DONE' });
    return;
  }
  try {
    const task = await taskService.updateTaskStatus(taskId, status);
    res.json(task);
  } catch (e: any) {
    if (e.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ message: 'Tarea no encontrada' });
    } else {
      res.status(500).json({ message: 'Error al actualizar tarea' });
    }
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const taskId = Number(req.params.id);
  try {
    await taskService.deleteTask(taskId);
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (e: any) {
    if (e.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ message: 'Tarea no encontrada' });
    } else {
      res.status(500).json({ message: 'Error al eliminar tarea' });
    }
  }
};