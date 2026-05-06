-- Seed opcional para demonstração acadêmica (dados extras).
-- Pode ser executado em banco já inicializado.

-- Alunos extras
INSERT INTO users (email, password_hash, role, status)
VALUES
  ('aluno1@gymapp.local', crypt('aluno123', gen_salt('bf')), 'member', 'active'),
  ('aluno2@gymapp.local', crypt('aluno123', gen_salt('bf')), 'member', 'pending'),
  ('aluno3@gymapp.local', crypt('aluno123', gen_salt('bf')), 'member', 'active')
ON CONFLICT (email) DO NOTHING;

-- Vínculos com a academia Ge Ribeiro (id = 1)
INSERT INTO memberships (gym_id, user_id, status)
SELECT 1, u.id, CASE WHEN u.status = 'active' THEN 'active' ELSE 'pending' END
FROM users u
WHERE u.email IN ('aluno1@gymapp.local', 'aluno2@gymapp.local', 'aluno3@gymapp.local')
  AND NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.gym_id = 1 AND m.user_id = u.id
  );

-- Treinos extras para aluno1 e aluno3
INSERT INTO workouts (gym_id, member_user_id, title, content)
SELECT 1, u.id, 'Treino A', 'Peito e tríceps: supino, crucifixo, tríceps pulley'
FROM users u
WHERE u.email = 'aluno1@gymapp.local'
  AND NOT EXISTS (
    SELECT 1 FROM workouts w WHERE w.gym_id = 1 AND w.member_user_id = u.id AND w.title = 'Treino A'
  );

INSERT INTO workouts (gym_id, member_user_id, title, content)
SELECT 1, u.id, 'Treino B', 'Costas e bíceps: puxada, remada, rosca direta'
FROM users u
WHERE u.email = 'aluno1@gymapp.local'
  AND NOT EXISTS (
    SELECT 1 FROM workouts w WHERE w.gym_id = 1 AND w.member_user_id = u.id AND w.title = 'Treino B'
  );

INSERT INTO workouts (gym_id, member_user_id, title, content)
SELECT 1, u.id, 'Treino C', 'Pernas: agachamento, leg press, cadeira extensora'
FROM users u
WHERE u.email = 'aluno3@gymapp.local'
  AND NOT EXISTS (
    SELECT 1 FROM workouts w WHERE w.gym_id = 1 AND w.member_user_id = u.id AND w.title = 'Treino C'
  );

-- Registros de check-in completos para demonstracao
INSERT INTO checkins (gym_id, member_user_id, workout_id, checked_in_at, checked_out_at)
SELECT
  1,
  u.id,
  w.id,
  NOW() - INTERVAL '2 day' + INTERVAL '08 hour',
  NOW() - INTERVAL '2 day' + INTERVAL '09 hour'
FROM users u
JOIN workouts w ON w.member_user_id = u.id AND w.gym_id = 1 AND w.title = 'Treino A'
WHERE u.email = 'aluno1@gymapp.local'
  AND NOT EXISTS (
    SELECT 1
    FROM checkins c
    WHERE c.member_user_id = u.id
      AND c.workout_id = w.id
      AND c.checked_in_at::date = (NOW() - INTERVAL '2 day')::date
  );

INSERT INTO checkins (gym_id, member_user_id, workout_id, checked_in_at, checked_out_at)
SELECT
  1,
  u.id,
  w.id,
  NOW() - INTERVAL '1 day' + INTERVAL '18 hour',
  NOW() - INTERVAL '1 day' + INTERVAL '19 hour 15 minute'
FROM users u
JOIN workouts w ON w.member_user_id = u.id AND w.gym_id = 1 AND w.title = 'Treino C'
WHERE u.email = 'aluno3@gymapp.local'
  AND NOT EXISTS (
    SELECT 1
    FROM checkins c
    WHERE c.member_user_id = u.id
      AND c.workout_id = w.id
      AND c.checked_in_at::date = (NOW() - INTERVAL '1 day')::date
  );
