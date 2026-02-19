import { Router } from 'express';
import { getTasks, createTask, updateStatus, deleteTask } from '../controllers/task.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

tasksRouter.get('/',             getTasks);
tasksRouter.post('/',            createTask);
tasksRouter.patch('/:id/status', updateStatus);
tasksRouter.delete('/:id',       deleteTask);