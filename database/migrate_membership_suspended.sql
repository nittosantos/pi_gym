-- Suspensão de vínculo (modo consulta para o aluno). Execute em bancos já criados antes desta feature.
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(40) NULL;

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;

ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('active', 'pending', 'suspended'));

COMMENT ON COLUMN memberships.suspension_reason IS
  'Chave do motivo da suspensão (MembershipSuspension::REASONS); NULL se não suspenso.';

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
  SET status = 'active',
      suspension_reason = NULL
  WHERE gym_id = p_gym_id AND user_id = p_member_id;

  UPDATE users
  SET status = 'active'
  WHERE id = p_member_id AND role = 'member';
END;
$$;
