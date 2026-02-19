-- ============================================
-- KANBAN EN TIEMPO REAL — Base de Datos MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS kanban_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kanban_db;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL,
  email           VARCHAR(150)    NOT NULL UNIQUE,
  password        VARCHAR(255)    NOT NULL,
  profile_image   VARCHAR(500)    NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: tasks
-- ============================================
CREATE TABLE tasks (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200)    NOT NULL,
  description   TEXT,
  status        ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
  assigned_to   INT UNSIGNED    NULL,
  created_by    INT UNSIGNED    NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to)
    REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT fk_tasks_created  FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_tasks_status       ON tasks(status);
CREATE INDEX idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by   ON tasks(created_by);