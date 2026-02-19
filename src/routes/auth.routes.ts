import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { upload } from '../middlewares/upload.middleware';

export const authRouter = Router();

authRouter.post('/register', upload.single('image'), register);
authRouter.post('/login',           login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password',  resetPassword);