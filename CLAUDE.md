# StudyForge — Architecture & Developer Guide

> **Nom provisoire :** StudyForge
> **But :** Application mobile de révision intelligente pour étudiants
> **Stack :** React Native + Expo (SDK 52) + TypeScript · Supabase · Anthropic API · RevenueCat

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Structure du projet](#structure-du-projet)
3. [Navigation](#navigation)
4. [Services](#services)
5. [Base de données Supabase](#base-de-données-supabase)
6. [Intégration Anthropic (IA)](#intégration-anthropic-ia)
7. [Monétisation RevenueCat](#monétisation-revenuecat)
8. [Variables d'environnement](#variables-denvironnement)
9. [Conventions de code](#conventions-de-code)
10. [Commandes utiles](#commandes-utiles)
11. [Roadmap](#roadmap)

---

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Framework mobile | React Native + Expo SDK 52 | UI cross-platform (iOS / Android) |
| Langage | TypeScript (strict mode) | Typage statique |
| Navigation | Expo Router v4 (file-based) | Routing déclaratif |
| Backend / Auth | Supabase | Auth, PostgreSQL, Storage, Edge Functions |
| IA générative | Anthropic Claude (claude-opus-4-6) | Génération de fiches & quizz |
| Paiements | RevenueCat | Abonnements in-app (free / pro) |
| Style | StyleSheet natif | Pas de lib CSS-in-JS externe |

---

## Structure du projet

```
studyforge/
├── app/                        # Expo Router — routes de l'app
│   ├── _layout.tsx             # Root layout (SplashScreen, providers)
│   ├── (tabs)/                 # Groupe tabs (nav bar principale)
│   │   ├── _layout.tsx         # Configuration de la tab bar
│   │   ├── index.tsx           # Accueil
│   │   ├── library.tsx         # Bibliothèque de fiches
│   │   ├── quiz.tsx            # Quizz
│   │   └── profile.tsx         # Profil & abonnement
│   └── (auth)/                 # Groupe auth (non connecté)
│       ├── _layout.tsx
│       ├── login.tsx
│       └── register.tsx
│
├── components/                 # Composants réutilisables
│   ├── navigation/
│   │   └── TabBarIcon.tsx      # Icône Ionicons pour la tab bar
│   ├── ui/
│   │   ├── Button.tsx          # Bouton générique (primary/secondary/danger)
│   │   └── Card.tsx            # Conteneur carte avec ombre
│   ├── flashcards/
│   │   └── FlashcardItem.tsx   # Élément de liste de fiche
│   └── quiz/
│       └── QuizCard.tsx        # Carte de question QCM
│
├── screens/                    # Écrans complets (utilisés dans les routes ou modales)
│   ├── FlashcardDetailScreen.tsx
│   └── GenerateFlashcardScreen.tsx
│
├── services/                   # Couche d'accès aux données / APIs externes
│   ├── supabase.ts             # Client Supabase + helpers auth & DB
│   ├── anthropic.ts            # Appels Edge Functions pour l'IA
│   └── revenuecat.ts           # Initialisation et helpers RevenueCat
│
├── hooks/                      # Custom hooks React
│   ├── useAuth.ts              # Session Supabase (subscribe onAuthStateChange)
│   ├── useFlashcards.ts        # CRUD fiches + état loading/error
│   └── useSubscription.ts      # Tier (free/pro) via RevenueCat
│
├── types/                      # Types TypeScript globaux
│   ├── index.ts                # UserProfile, Flashcard, QuizQuestion, etc.
│   └── database.ts             # Types générés Supabase (schéma DB)
│
├── constants/
│   └── Colors.ts               # Palette de couleurs (light + dark)
│
├── assets/                     # Images, icônes, splash
│
├── supabase/                   # (À créer) Edge Functions Deno
│   └── functions/
│       ├── generate-flashcard/ # Wrapper Anthropic → fiche structurée
│       └── generate-quiz/      # Wrapper Anthropic → tableau de questions
│
├── app.json                    # Config Expo (bundle ID, scheme, plugins)
├── package.json
├── tsconfig.json               # strict + path aliases (@/*)
├── babel.config.js             # babel-preset-expo + module-resolver
└── CLAUDE.md                   # Ce fichier
```

---

## Navigation

L'app utilise **Expo Router v4** (file-based routing, similaire à Next.js).

### Groupes de routes

| Groupe | Chemin | Accès |
|---|---|---|
| `(tabs)` | `/`, `/library`, `/quiz`, `/profile` | Utilisateur connecté |
| `(auth)` | `/login`, `/register` | Utilisateur non connecté |

### Logique de redirection auth

À implémenter dans `app/_layout.tsx` avec `useAuth` :

```tsx
const { session, loading } = useAuth();

useEffect(() => {
  if (!loading) {
    if (session) router.replace('/(tabs)');
    else router.replace('/(auth)/login');
  }
}, [session, loading]);
```

### Ajout d'une route modale

Créer `app/flashcard/[id].tsx` → accessible via `router.push('/flashcard/abc123')`.

---

## Services

### `services/supabase.ts`

Client Supabase initialisé avec `expo-secure-store` pour la persistence de session native.

**Variables requises :**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Helpers exposés :**
- `signUp(email, password, firstName)` → inscription
- `signIn(email, password)` → connexion
- `signOut()` → déconnexion
- `getSession()` → session courante
- `getFlashcards(userId)` → liste des fiches
- `createFlashcard(data)` → création fiche
- `deleteFlashcard(id)` → suppression
- `getQuizSessions(userId)` → historique quizz
- `createQuizSession(data)` → nouvelle session quizz

### `services/anthropic.ts`

**IMPORTANT :** La clé Anthropic ne doit JAMAIS être exposée côté client.
Toutes les requêtes IA passent par des **Supabase Edge Functions** (serveur Deno).

**Pattern :**
```
App → Supabase Edge Function (auth token JWT) → Anthropic API
```

**Fonctions exposées :**
- `generateFlashcard(sourceText, subject, accessToken)` → `FlashcardContent`
- `generateQuiz(flashcardContent, questionCount, accessToken)` → `QuizQuestion[]`

### `services/revenuecat.ts`

Initialiser au démarrage dans `app/_layout.tsx` :

```ts
initializeRevenueCat(user?.id); // passer l'ID Supabase comme appUserID RevenueCat
```

---

## Base de données Supabase

### Schéma (tables principales)

```sql
-- Profils utilisateur (sync avec auth.users via trigger)
create table profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  first_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fiches de révision
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  subject text not null,
  content text not null,       -- contenu markdown généré par l'IA
  source_text text,            -- texte source fourni par l'utilisateur
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions de quizz
create table quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  flashcard_id uuid references flashcards(id) on delete cascade,
  score integer default 0,
  total_questions integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Réponses individuelles
create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade,
  question_index integer not null,
  selected_index integer not null,
  is_correct boolean not null,
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

Activer RLS sur toutes les tables. Politique de base :

```sql
-- Exemple pour flashcards
create policy "Users can only access their own flashcards"
  on flashcards for all
  using (user_id = auth.uid());
```

### Générateur de types

Après modification du schéma :

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
```

---

## Intégration Anthropic (IA)

### Edge Functions Supabase (Deno)

Les fonctions sont dans `supabase/functions/`. Déployer avec :

```bash
npx supabase functions deploy generate-flashcard
npx supabase functions deploy generate-quiz
```

### Prompts recommandés

**generate-flashcard :**
```
Tu es un expert pédagogique. À partir du texte suivant sur "{subject}",
génère une fiche de révision structurée avec :
- Un titre clair
- Les concepts clés (liste de 5-10 points)
- Un résumé (3-5 phrases)
- Les points importants à retenir

Réponds UNIQUEMENT en JSON valide avec les clés :
{ "title": string, "key_concepts": string[], "summary": string, "key_points": string[] }
```

**generate-quiz :**
```
À partir du contenu de révision suivant, génère {n} questions QCM en français.
Chaque question doit avoir 4 options, une seule bonne réponse, et une explication.

Réponds UNIQUEMENT en JSON valide :
[{ "id": string, "question": string, "options": string[4], "correct_index": number, "explanation": string }]
```

### Modèle utilisé

`claude-opus-4-6` — le modèle le plus capable de la famille Claude 4.

---

## Monétisation RevenueCat

### Tiers

| Feature | Free | Pro |
|---|---|---|
| Fiches max | 10 | Illimité |
| Quizz / jour | 3 | Illimité |
| Générations IA / jour | 3 | Illimité |

### Initialisation

```ts
// app/_layout.tsx
import { initializeRevenueCat } from '@/services/revenuecat';

// Appeler après récupération de la session
initializeRevenueCat(session?.user.id);
```

### Hook `useSubscription`

```ts
const { tier, loading } = useSubscription();
if (tier === 'free') { /* afficher paywall */ }
```

### Identifiers produits (à configurer dans RevenueCat dashboard)

- `studyforge_pro_monthly` — abonnement mensuel
- `studyforge_pro_yearly` — abonnement annuel (recommandé)

---

## Variables d'environnement

Créer un fichier `.env` à la racine (gitignored) :

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# RevenueCat (préfixe EXPO_PUBLIC_ pour accès côté client)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...

# Anthropic (côté serveur uniquement — Edge Function Supabase)
# Ne jamais mettre dans .env côté client !
# Ajouter dans le dashboard Supabase : Settings > Edge Functions > Secrets
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Conventions de code

### Fichiers

- Composants React → **PascalCase** (`FlashcardItem.tsx`)
- Hooks → **camelCase** préfixé par `use` (`useAuth.ts`)
- Services → **camelCase** (`supabase.ts`)
- Constants → **PascalCase** (`Colors.ts`)

### Imports

Utiliser les path aliases définis dans `tsconfig.json` :

```ts
import { Colors } from '@/constants/Colors';
import { Flashcard } from '@/types';
import { supabase } from '@/services/supabase';
```

### Composants

- Préférer les **function components** avec des props typées en interface
- Les styles dans un `StyleSheet.create()` en bas du fichier
- Pas de styled-components ni de Tailwind

### Gestion d'état

- État local → `useState` / `useReducer`
- État serveur → hooks custom (`useFlashcards`, `useAuth`)
- Pas de Redux ni Zustand pour l'instant (à évaluer si besoin)

---

## Commandes utiles

```bash
# Démarrer le projet
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android

# Vérification TypeScript
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Générer les types Supabase
npx supabase gen types typescript --project-id <ID> > types/database.ts

# Déployer une Edge Function
npx supabase functions deploy <function-name>

# Build production (EAS)
npx eas build --platform ios
npx eas build --platform android
```

---

## Roadmap

### Phase 1 — MVP (en cours)
- [x] Setup Expo Router + navigation tabs
- [x] Structure de dossiers et services de base
- [x] Types TypeScript et schéma DB
- [ ] Auth Supabase (login / register fonctionnels)
- [ ] CRUD fiches de révision
- [ ] Génération IA via Edge Function
- [ ] Quizz basique

### Phase 2 — Monétisation
- [ ] Intégration RevenueCat complète
- [ ] Écran paywall
- [ ] Gating des features pro

### Phase 3 — Engagement
- [ ] Streak quotidien
- [ ] Notifications push (révisions planifiées)
- [ ] Statistiques de progression
- [ ] Mode sombre

### Phase 4 — Scale
- [ ] Partage de fiches entre utilisateurs
- [ ] Import PDF / photos de cours
- [ ] Synthèse vocale des fiches
