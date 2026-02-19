import { Router } from 'express';
import { getUsers, uploadProfileImage } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get('/',                           getUsers);
usersRouter.patch('/me/profile-image', upload.single('image'), uploadProfileImage);