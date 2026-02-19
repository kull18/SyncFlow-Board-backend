import { pool } from '../config/database';
import cloudinary from '../config/cloudinary';

export const getAllUsers = async () => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, profile_image, created_at FROM users ORDER BY name ASC'
  );
  return rows;
};


//se implementa en el auth pero da igual xD
export const uploadProfileImage = async (userId: number, fileBuffer: Buffer, mimetype: string) => {
  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'kanban/profiles',
        public_id:      `user_${userId}`,
        overwrite:      true,
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

  await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [result.secure_url, userId]);
  return result.secure_url as string;
};