import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database';
import { resend } from '../config/resend';
import cloudinary from '../config/cloudinary';

const resetTokens = new Map<string, { userId: number; expiresAt: number }>();

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  imageBuffer?: Buffer   // 👈 opcional
) => {
  const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('EMAIL_TAKEN');

  const hashed = await bcrypt.hash(password, 10);
  const [result]: any = await pool.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed]
  );

  const userId = result.insertId;
  let profileImageUrl: string | null = null;

  // Si viene imagen la subimos a Cloudinary
  if (imageBuffer) {
    profileImageUrl = await uploadToCloudinary(userId, imageBuffer);
    await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [profileImageUrl, userId]);
  }

  const token = generateToken(userId, email);
  return {
    token,
    user: { id: userId, name, email, profile_image: profileImageUrl },
  };
};


const uploadToCloudinary = (userId: number, buffer: Buffer): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'kanban/profiles',
        public_id:      `user_${userId}`,
        overwrite:      true,
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });



export const loginUser = async (email: string, password: string) => {
  const [rows]: any = await pool.query(
    'SELECT id, name, email, password, profile_image FROM users WHERE email = ?',
    [email]
  );
  if (rows.length === 0) throw new Error('INVALID_CREDENTIALS');

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('INVALID_CREDENTIALS');

  const token = generateToken(user.id, user.email);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, profile_image: user.profile_image },
  };
};

export const forgotPassword = async (email: string) => {
  const [rows]: any = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
  if (rows.length === 0) return;

  const user = rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt  = Date.now() + 60 * 60 * 1000;

  resetTokens.set(resetToken, { userId: user.id, expiresAt });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to:   email,
    subject: 'Recuperación de contraseña — Kanban',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Hola, ${user.name}</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;
                  border-radius:6px;text-decoration:none;font-weight:bold;">
          Restablecer contraseña
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          Si no solicitaste esto, ignora este correo.
        </p>
      </div>
    `,
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  const data = resetTokens.get(token);
  if (!data) throw new Error('INVALID_TOKEN');
  if (Date.now() > data.expiresAt) {
    resetTokens.delete(token);
    throw new Error('TOKEN_EXPIRED');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, data.userId]);
  resetTokens.delete(token);
};

const generateToken = (userId: number, email: string): string =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);