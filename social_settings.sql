-- Rulează în Supabase SQL Editor (opțional — pentru toggle Auto-pilot în dashboard)
CREATE TABLE IF NOT EXISTS social_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  autopilot boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO social_settings (id, autopilot) VALUES (1, false)
  ON CONFLICT (id) DO NOTHING;
