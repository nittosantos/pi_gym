-- Adiciona vínculo opcional de check-in com treino realizado no dia.
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS workout_id INT NULL REFERENCES workouts (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkins_workout ON checkins (workout_id);
