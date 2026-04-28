-- Consultas de demonstracao para apresentacao no DBeaver/psql.
-- Execute na ordem sugerida.

-- 1) Validar objetos academicos criados
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE specific_schema = 'public'
  AND routine_name IN (
    'fn_workout_display_title',
    'fn_training_duration_minutes',
    'sp_approve_member'
  )
ORDER BY routine_name;

SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('checkins_validate_times', 'workouts_touch_updated_at')
ORDER BY trigger_name;

-- 2) Verificar dados base e extras
SELECT id, email, role, status
FROM users
ORDER BY id;

SELECT id, name, owner_user_id
FROM gyms
ORDER BY id;

SELECT id, gym_id, user_id, status
FROM memberships
ORDER BY id;

-- 3) Testar procedure de aprovacao
-- Troque o id conforme necessario (ex: aluno2 geralmente inicia pendente)
-- CALL sp_approve_member(1, 3);

-- 4) Testar function de titulo de treino
SELECT id, fn_workout_display_title(id) AS display_title
FROM workouts
ORDER BY id;

-- 5) Testar function de duracao
SELECT
  id AS checkin_id,
  checked_in_at,
  checked_out_at,
  fn_training_duration_minutes(checked_in_at, checked_out_at) AS duration_minutes
FROM checkins
ORDER BY id DESC;

-- 6) Testar trigger de validacao de horario (espera erro)
-- Descomente apenas para validar erro:
-- INSERT INTO checkins (gym_id, member_user_id, workout_id, checked_in_at, checked_out_at)
-- VALUES (1, 2, NULL, NOW(), NOW() - INTERVAL '30 minutes');

-- 7) Relatorio final
SELECT *
FROM vw_training_records
ORDER BY checkin_id DESC;
