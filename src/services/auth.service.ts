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
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f8fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2d3748; padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                🔐 Recuperación de Contraseña
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1a202c; font-size: 24px; font-weight: 600;">
                Hola, ${user.name}
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Para continuar con el proceso, haz clic en el botón de abajo.
              </p>

              <!-- Alert Box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 32px; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⏱️ <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
                </p>
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; 
                              padding: 16px 40px; 
                              background-color: #0ea5e9;
                              color: #ffffff; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                              transition: transform 0.2s;">
                      Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 13px; font-weight: 600;">
                  ¿El botón no funciona?
                </p>
                <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.5; word-break: break-all;">
                  Copia y pega este enlace en tu navegador:<br>
                  <a href="${resetUrl}" style="color: #0ea5e9; text-decoration: underline;">${resetUrl}</a>
                </p>
              </div>

              <!-- Footer Info -->
              <p style="margin: 0; color: #a0aec0; font-size: 14px; line-height: 1.6;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña no será modificada.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px;">
                © 2026 Tu Empresa. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                Este es un correo automático, por favor no responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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