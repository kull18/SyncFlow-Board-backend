#  SyncFlow Board Backend

Backend para aplicación Kanban en tiempo real construido con **Node.js + TypeScript**, **Express**, **MySQL**, **WebSockets**, **Cloudinary** y **Resend**.

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js + TypeScript | Servidor principal |
| Express | Framework HTTP |
| MySQL2 | Base de datos |
| WebSockets (ws) | Comunicación en tiempo real |
| JWT | Autenticación |
| Bcrypt | Hash de contraseñas |
| Cloudinary | Almacenamiento de imágenes |
| Resend | Envío de emails |
| Multer | Manejo de archivos |

---

## Arquitectura del Proyecto

```
src/
├── config/
│   ├── database.ts       # Conexión MySQL
│   ├── cloudinary.ts     # Configuración Cloudinary
│   ├── resend.ts         # Configuración Resend
│   └── websocket.ts      # Servidor WebSocket
├── controllers/
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   └── user.controller.ts
├── middlewares/
│   ├── auth.middleware.ts    # Verificación JWT
│   └── upload.middleware.ts  # Manejo de imágenes (Multer)
├── routes/
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   └── user.routes.ts
├── services/
│   ├── auth.service.ts   # Lógica de autenticación
│   ├── task.service.ts   # Lógica de tareas
│   └── user.service.ts   # Lógica de usuarios
├── types/
│   └── index.ts          # Interfaces TypeScript
└── index.ts              # Entrada principal
```

---

## Instalación y configuración

### 1. Clonar e instalar dependencias

```bash
git clone <repositorio>
cd SyncFlow-Board-backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```env
# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=kanban_db

# JWT
JWT_SECRET=cambia_esto_por_un_secreto_seguro
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=no-reply@tudominio.com

# URL del frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Crear la base de datos

```bash
mysql -u root -p < database.sql
```

### 4. Ejecutar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

---

## Endpoints

### Auth — `/api/auth`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/register` | Registro de usuario (soporta foto de perfil) | ❌ |
| POST | `/login` | Inicio de sesión | ❌ |
| POST | `/forgot-password` | Enviar email de recuperación | ❌ |
| POST | `/reset-password` | Restablecer contraseña con token | ❌ |

### Tasks — `/api/tasks`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Obtener todas las tareas | ✅ |
| POST | `/` | Crear nueva tarea | ✅ |
| PATCH | `/:id/status` | Cambiar estado de tarea | ✅ |
| DELETE | `/:id` | Eliminar tarea | ✅ |

### Users — `/api/users`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Obtener todos los usuarios | ✅ |
| PATCH | `/me/profile-image` | Actualizar foto de perfil | ✅ |

---

## 📡 WebSocket

Conectar al WebSocket enviando el JWT como query parameter:

```
ws://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Eventos que emite el servidor

```json
// Tarea creada
{ "type": "TASK_CREATED", "payload": { ...task } }

// Tarea actualizada (cambio de estado)
{ "type": "TASK_UPDATED", "payload": { ...task } }

// Tarea eliminada
{ "type": "TASK_DELETED", "payload": { "id": 1 } }
```

---

## 📬 Ejemplos de uso

### Registro con foto de perfil

```
POST /api/auth/register
Content-Type: multipart/form-data

name     = Juan Pérez
email    = juan@gmail.com
password = 123456
image    = foto.jpg  (opcional)
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@gmail.com",
    "profile_image": "https://res.cloudinary.com/..."
  }
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@gmail.com",
  "password": "123456"
}
```

### Crear tarea

```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Diseñar pantalla de login",
  "description": "Crear mockup en Figma",
  "assigned_to": 2
}
```

### Cambiar estado de tarea

```
PATCH /api/tasks/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

Estados válidos: `TODO` · `IN_PROGRESS` · `DONE`

### Recuperar contraseña

```
POST /api/auth/forgot-password
Content-Type: application/json

{ "email": "juan@gmail.com" }
```

```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "token_recibido_por_email",
  "newPassword": "nueva_contraseña"
}
```

---

## Base de Datos

```
users
├── id
├── name
├── email
├── password (bcrypt)
├── profile_image (URL Cloudinary, nullable)
├── created_at
└── updated_at

tasks
├── id
├── title
├── description
├── status (TODO | IN_PROGRESS | DONE)
├── assigned_to → users.id
├── created_by  → users.id
├── created_at
└── updated_at
```

---

## Despliegue en EC2

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar proyecto
git clone <repositorio>
cd kanban-backend
npm install
npm run build

# Correr con PM2
npm install -g pm2
pm2 start dist/index.js --name kanban-backend
pm2 save
pm2 startup
```

Recuerda abrir los puertos **3000 (HTTP)** y **3000 (WS)** en el Security Group de tu instancia EC2.
