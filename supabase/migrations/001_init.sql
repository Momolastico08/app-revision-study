-- =============================================================================
-- StudyForge — Migration 001 : schéma initial
-- =============================================================================
-- Appliquer via : npx supabase db push
--             ou : coller dans l'éditeur SQL du dashboard Supabase
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================

create extension if not exists "uuid-ossp";   -- gen_random_uuid() de secours
create extension if not exists "pg_trgm";     -- index full-text trigram (recherche)


-- =============================================================================
-- 1. FONCTION utilitaire : mise à jour automatique de updated_at
-- =============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 2. TABLE : profiles
--    Synchronisée avec auth.users via trigger (voir section 7).
-- =============================================================================

create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  full_name   text        not null default '',
  avatar_url  text,
  tier        text        not null default 'free'
                          check (tier in ('free', 'pro')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger updated_at
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Index (la PK suffit, mais on indexe email pour les lookups auth)
create index if not exists idx_profiles_email on profiles (email);

-- RLS
alter table profiles enable row level security;

create policy "profiles: select own"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on profiles for update
  using (id = auth.uid());

-- INSERT géré uniquement par le trigger handle_new_user (section 7),
-- pas besoin de politique INSERT publique.


-- =============================================================================
-- 3. TABLE : courses
--    Un "cours" regroupe des fiches par matière/niveau.
-- =============================================================================

create table if not exists courses (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  title       text        not null,
  subject     text        not null,
  level       text        not null
                          check (level in ('collège', 'lycée', 'licence', 'master')),
  color       text        not null default '#4F46E5',   -- hex couleur UI
  icon        text        not null default '📖',        -- emoji ou nom d'icône
  created_at  timestamptz not null default now()
);

-- Pas de updated_at : les cours sont rarement modifiés.
-- Si nécessaire, ajouter un trigger comme pour profiles.

-- Index performances
create index if not exists idx_courses_user_id on courses (user_id);

-- RLS
alter table courses enable row level security;

create policy "courses: all own"
  on courses for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- =============================================================================
-- 4. TABLE : flashcards
--    Système de répétition espacée : difficulty, review_count, next_review.
-- =============================================================================

create table if not exists flashcards (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references profiles(id)  on delete cascade,
  course_id     uuid        not null references courses(id)   on delete cascade,
  question      text        not null,
  answer        text        not null,
  source_text   text,                        -- texte source brut (optionnel)
  difficulty    smallint    not null default 3
                            check (difficulty between 1 and 5),
  review_count  integer     not null default 0,
  last_reviewed timestamptz,
  next_review   timestamptz,                 -- calculé par l'algorithme SRS
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger updated_at
create trigger trg_flashcards_updated_at
  before update on flashcards
  for each row execute function set_updated_at();

-- Index performances
create index if not exists idx_flashcards_user_id   on flashcards (user_id);
create index if not exists idx_flashcards_course_id  on flashcards (course_id);
create index if not exists idx_flashcards_next_review on flashcards (user_id, next_review)
  where next_review is not null;   -- index partiel : uniquement les fiches planifiées

-- Index full-text pour la recherche (question + answer)
create index if not exists idx_flashcards_search
  on flashcards using gin (
    (to_tsvector('french', coalesce(question, '') || ' ' || coalesce(answer, '')))
  );

-- RLS
alter table flashcards enable row level security;

create policy "flashcards: all own"
  on flashcards for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- =============================================================================
-- 5. TABLE : quiz_sessions
--    Une session = un quizz complet sur un cours donné.
-- =============================================================================

create table if not exists quiz_sessions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references profiles(id)  on delete cascade,
  course_id        uuid        not null references courses(id)   on delete cascade,
  score            smallint    not null default 0
                               check (score >= 0),
  total_questions  smallint    not null default 0
                               check (total_questions >= 0),
  duration_seconds integer     not null default 0
                               check (duration_seconds >= 0),
  completed_at     timestamptz not null default now()
);

-- Index performances
create index if not exists idx_quiz_sessions_user_id   on quiz_sessions (user_id);
create index if not exists idx_quiz_sessions_course_id  on quiz_sessions (course_id);
create index if not exists idx_quiz_sessions_completed_at
  on quiz_sessions (user_id, completed_at desc);  -- tri historique récent en tête

-- RLS
alter table quiz_sessions enable row level security;

create policy "quiz_sessions: all own"
  on quiz_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- =============================================================================
-- 6. TABLE : quiz_results
--    Détail de chaque réponse dans une session.
-- =============================================================================

create table if not exists quiz_results (
  id                  uuid        primary key default gen_random_uuid(),
  session_id          uuid        not null references quiz_sessions(id) on delete cascade,
  flashcard_id        uuid        not null references flashcards(id)    on delete cascade,
  user_answer         text        not null,
  is_correct          boolean     not null,
  time_spent_seconds  smallint    not null default 0
                                  check (time_spent_seconds >= 0),
  created_at          timestamptz not null default now()
);

-- Index performances
create index if not exists idx_quiz_results_session_id   on quiz_results (session_id);
create index if not exists idx_quiz_results_flashcard_id  on quiz_results (flashcard_id);

-- RLS : l'utilisateur accède à ses résultats via la session (join implicite).
-- On utilise une sous-requête sur quiz_sessions pour vérifier l'ownership.
alter table quiz_results enable row level security;

create policy "quiz_results: all own via session"
  on quiz_results for all
  using (
    exists (
      select 1
      from quiz_sessions s
      where s.id = quiz_results.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from quiz_sessions s
      where s.id = quiz_results.session_id
        and s.user_id = auth.uid()
    )
  );


-- =============================================================================
-- 7. TRIGGER : création automatique d'un profil à l'inscription
--    Se déclenche sur auth.users après INSERT (géré par Supabase Auth).
-- =============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer                       -- s'exécute en tant que propriétaire
set search_path = public               -- évite les injections de search_path
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- S'assurer qu'il n'existe pas déjà avant de créer
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- =============================================================================
-- 8. FONCTION : statistiques de révision par cours
--    get_course_stats(p_course_id uuid)
--    Retourne une ligne avec les métriques clés du cours.
-- =============================================================================

create or replace function get_course_stats(p_course_id uuid)
returns table (
  course_id           uuid,
  total_flashcards    bigint,
  due_flashcards      bigint,    -- fiches dont next_review <= now()
  mastered_flashcards bigint,    -- fiches avec difficulty <= 2 et review_count >= 3
  avg_difficulty      numeric,
  total_quiz_sessions bigint,
  avg_score_pct       numeric,   -- score moyen en %
  last_studied_at     timestamptz
)
language sql
stable                           -- lecture seule, même résultat dans la transaction
security definer
set search_path = public
as $$
  select
    p_course_id                                                   as course_id,

    -- Fiches
    count(f.id)                                                   as total_flashcards,

    count(f.id) filter (
      where f.next_review is not null
        and f.next_review <= now()
    )                                                             as due_flashcards,

    count(f.id) filter (
      where f.difficulty <= 2
        and f.review_count >= 3
    )                                                             as mastered_flashcards,

    round(avg(f.difficulty), 1)                                   as avg_difficulty,

    -- Quizz
    (
      select count(*)
      from quiz_sessions qs
      where qs.course_id = p_course_id
        and qs.user_id   = auth.uid()
    )                                                             as total_quiz_sessions,

    (
      select round(
        avg(qs.score::numeric / nullif(qs.total_questions, 0) * 100),
        1
      )
      from quiz_sessions qs
      where qs.course_id = p_course_id
        and qs.user_id   = auth.uid()
        and qs.total_questions > 0
    )                                                             as avg_score_pct,

    (
      select max(qs.completed_at)
      from quiz_sessions qs
      where qs.course_id = p_course_id
        and qs.user_id   = auth.uid()
    )                                                             as last_studied_at

  from flashcards f
  where f.course_id = p_course_id
    and f.user_id   = auth.uid();
$$;

-- Exemple d'appel depuis le client Supabase :
--   const { data } = await supabase.rpc('get_course_stats', { p_course_id: '...' });


-- =============================================================================
-- 9. FONCTION : fiches à réviser aujourd'hui pour un utilisateur
--    get_due_flashcards(p_user_id uuid, p_limit int default 20)
-- =============================================================================

create or replace function get_due_flashcards(
  p_user_id uuid,
  p_limit   int default 20
)
returns setof flashcards
language sql
stable
security definer
set search_path = public
as $$
  select *
  from flashcards
  where user_id    = p_user_id
    and (
      next_review is null          -- jamais révisée → prioritaire
      or next_review <= now()
    )
  order by
    next_review asc nulls first,  -- jamais révisées en tête
    difficulty  desc              -- puis les plus difficiles
  limit p_limit;
$$;


-- =============================================================================
-- FIN DE LA MIGRATION 001
-- =============================================================================
