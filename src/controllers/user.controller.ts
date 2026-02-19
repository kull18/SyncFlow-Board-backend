import { Request, Response } from 'express';
import * as userService from '../services/user.service';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const uploadProfileImage = async (req: MulterRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ message: 'No se proporcionó ninguna imagen' }); return; }
  try {
    const imageUrl = await userService.uploadProfileImage(
      req.user!.userId, req.file.buffer, req.file.mimetype
    );
    res.json({ message: 'Imagen actualizada correctamente', profile_image: imageUrl });
  } catch {
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
};