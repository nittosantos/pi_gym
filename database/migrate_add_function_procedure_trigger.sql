-- PostgreSQL: função + procedure + trigger (requisitos acadêmicos).
-- Rode após o schema base (e após migrate_add_checkout / migrate_add_checkin_workout, se usar).

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
  'Retorna o título do treino ou um rótulo padrão Treino #id.';

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
  'Aprova membership e ativa o usuário membro.';

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_checkins_times_valid'
      AND conrelid = 'checkins'::regclass
  ) THEN
    ALTER TABLE checkins
      ADD CONSTRAINT chk_checkins_times_valid
      CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at);
  END IF;
END;
$$;

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
