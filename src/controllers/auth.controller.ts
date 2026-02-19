import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    return;
  }

  try {
    const data = await authService.registerUser(
      name,
      email,
      password,
      req.file?.buffer  
    );
    res.status(201).json(data);
  } catch (e: any) {
    if (e.message === 'EMAIL_TAKEN') {
      res.status(409).json({ message: 'El email ya está registrado' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son requeridos' });
    return;
  }
  try {
    const data = await authService.loginUser(email, password);
    res.json(data);
  } catch (e: any) {
    if (e.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ message: 'Credenciales incorrectas' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ message: 'El email es requerido' }); return; }
  try {
    await authService.forgotPassword(email);
    res.json({ message: 'Si el email existe, recibirás un correo con instrucciones' });
  } catch {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    return;
  }
  try {
    await authService.resetPassword(token, newPassword);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (e: any) {
    if (e.message === 'INVALID_TOKEN') {
      res.status(400).json({ message: 'Token inválido' });
    } else if (e.message === 'TOKEN_EXPIRED') {
      res.status(400).json({ message: 'El token ha expirado, solicita uno nuevo' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};