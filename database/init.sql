-- Academia MVP — PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gyms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    owner_user_id INT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    gym_id INT NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id, user_id)
);

CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    gym_id INT NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,
    member_user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checkins (
    id SERIAL PRIMARY KEY,
    gym_id INT NOT NULL REFERENCES gyms (id) ON DELETE CASCADE,
    member_user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    workout_id INT NULL REFERENCES workouts (id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_checkins_times_valid
      CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at)
);

CREATE INDEX idx_memberships_gym ON memberships (gym_id);
CREATE INDEX idx_memberships_user ON memberships (user_id);
CREATE INDEX idx_workouts_member ON workouts (member_user_id);
CREATE INDEX idx_workouts_gym ON workouts (gym_id);
CREATE INDEX idx_checkins_member ON checkins (member_user_id);
CREATE INDEX idx_checkins_gym ON checkins (gym_id);
CREATE INDEX idx_checkins_workout ON checkins (workout_id);

-- ---------------------------------------------------------------------------
-- Requisitos acadêmicos (PostgreSQL): 1 função, 1 procedure, 1 trigger
-- (No MySQL da disciplina a sintaxe difere; aqui é PL/pgSQL nativo.)
-- ---------------------------------------------------------------------------

-- Função: rótulo exibível do treino (título ou "Treino #<id>")
CREATE OR REPLACE FUNCTION fn_workout_display_title(p_workout_id INT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(w.title, 'Treino #' || w.id::TEXT)
  FROM workouts w
  WHERE w.id = p_workout_id;
$$;

COMMENT ON FUNCTION fn_workout_display_title(INT) IS
  'Retorna o título do treino ou um rótulo padrão Treino #id (uso em relatórios/histórico).';

-- Procedure: aprova aluno na academia (membership + usuário membro ativos)
CREATE OR REPLACE PROCEDURE sp_approve_member(IN p_gym_id INT, IN p_member_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_gym_id IS NULL OR p_gym_id <= 0 OR p_member_id IS NULL OR p_member_id <= 0 THEN
    RAISE EXCEPTION 'Parâmetros inválidos' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    WHERE m.gym_id = p_gym_id
      AND m.user_id = p_member_id
      AND u.role = 'member'
  ) THEN
    RAISE EXCEPTION 'Aluno não encontrado nesta academia' USING ERRCODE = 'P0001';
  END IF;

  UPDATE memberships
  SET status = 'active'
  WHERE gym_id = p_gym_id AND user_id = p_member_id;

  UPDATE users
  SET status = 'active'
  WHERE id = p_member_id AND role = 'member';
END;
$$;

COMMENT ON PROCEDURE sp_approve_member(INT, INT) IS
  'Aprova o vínculo do aluno com a academia e ativa a conta do usuário membro.';

-- Trigger: impede saída anterior à entrada nos registros de check-in
CREATE OR REPLACE FUNCTION trg_checkins_validate_times()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.checked_out_at IS NOT NULL AND NEW.checked_out_at < NEW.checked_in_at THEN
    RAISE EXCEPTION 'Horário de saída não pode ser anterior ao de entrada'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS checkins_validate_times ON checkins;
CREATE TRIGGER checkins_validate_times
  BEFORE INSERT OR UPDATE OF checked_in_at, checked_out_at ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION trg_checkins_validate_times();

COMMENT ON TRIGGER checkins_validate_times ON checkins IS
  'Garante checked_out_at >= checked_in_at quando a saída está preenchida.';

-- Trigger complementar: atualiza updated_at automaticamente em workouts
CREATE OR REPLACE FUNCTION trg_workouts_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workouts_touch_updated_at ON workouts;
CREATE TRIGGER workouts_touch_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION trg_workouts_touch_updated_at();

COMMENT ON TRIGGER workouts_touch_updated_at ON workouts IS
  'Atualiza updated_at automaticamente em cada UPDATE de workouts.';

-- Função de apoio para relatórios: duração total em minutos
CREATE OR REPLACE FUNCTION fn_training_duration_minutes(
  p_checked_in_at TIMESTAMPTZ,
  p_checked_out_at TIMESTAMPTZ
)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_checked_out_at IS NULL OR p_checked_out_at < p_checked_in_at THEN NULL
    ELSE FLOOR(EXTRACT(EPOCH FROM (p_checked_out_at - p_checked_in_at)) / 60)::INT
  END;
$$;

COMMENT ON FUNCTION fn_training_duration_minutes(TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Calcula a duração do treino em minutos; retorna NULL para registros em aberto.';

-- View para apresentação/consulta no DBeaver (registros de treino com contexto)
CREATE OR REPLACE VIEW vw_training_records AS
SELECT
  c.id AS checkin_id,
  c.gym_id,
  g.name AS gym_name,
  c.member_user_id,
  u.email AS member_email,
  c.workout_id,
  fn_workout_display_title(c.workout_id) AS workout_display_title,
  c.checked_in_at,
  c.checked_out_at,
  fn_training_duration_minutes(c.checked_in_at, c.checked_out_at) AS duration_minutes
FROM checkins c
JOIN users u ON u.id = c.member_user_id
JOIN gyms g ON g.id = c.gym_id;

-- Owner demo: owner@gymapp.local / owner123 (hash via pgcrypto, compatível com password_verify do PHP)
INSERT INTO users (email, password_hash, role, status)
VALUES (
    'owner@gymapp.local',
    crypt('owner123', gen_salt('bf')),
    'owner',
    'active'
);

INSERT INTO gyms (name, owner_user_id)
VALUES ('Academia Demo', 1);
