-- =============================================================================
-- StudyForge — Migration 002 : niveau d'études dans profiles
-- =============================================================================

-- 1. Ajout de la colonne level dans profiles
--    (avec CHECK pour correspondre exactement aux valeurs du type Level côté app)
alter table profiles
  add column if not exists level text
    check (level in ('collège', 'lycée', 'licence', 'master'));

-- 2. Mise à jour du trigger handle_new_user pour propager le level
--    passé dans raw_user_meta_data lors de l'inscription.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'level'   -- 'collège' | 'lycée' | 'licence' | 'master'
  );
  return new;
end;
$$;
