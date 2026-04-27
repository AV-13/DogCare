# Changelog

Toutes les évolutions notables du projet sont consignées ici.

## 2026-04-27 — Tests, redesign, seed et infrastructure Azure

Session de travail couvrant la couverture de tests, la refonte visuelle complète,
un seed riche pour les démos, et le déploiement sur deux VMs Azure orchestré par
Jenkins.

### Tests

#### Backend (Jest + supertest) — 54 tests / 4 suites

- Infrastructure (`server/tests/`) : `globalSetup.js` qui crée la base
  `dogcare_test` à la volée et joue `init.sql` si la table `users` est absente
  (idempotent en local **et** sur le runner CI). `setup.js` charge `.env.test`
  uniquement s'il existe (le CI fournit ses propres variables d'environnement).
  `helpers.js` expose `cleanDb`, `createUserAndToken`, `createDog`, `createEvent`.
- `auth.test.js` : register (succès, validations email/password/first_name,
  conflit 409), login (succès, mauvais password, email inconnu, validation
  body vide).
- `middleware.test.js` : middleware JWT avec header manquant, schéma invalide,
  token cassé, expiré, valide → `req.user` peuplé.
- `dogs.test.js` : CRUD complet, vérification du `user_id` issu du token, calcul
  `upcoming_events_count`, ownership 403/404, `vaccines/upcoming`, suppression
  cascade des events.
- `events.test.js` : CRUD, filtre `?type=`, `next_due_date` ignoré pour les
  non-vaccins, blocage du changement de `type`, calendar (groupage, validation
  du mois, rollover décembre→janvier), history (pagination, filtre passé,
  `limit` capé à 100), ownership.

#### Frontend (Vitest + React Testing Library) — 59 tests / 10 fichiers

- `components/DogCard.test.jsx`, `EventRow.test.jsx`, `Navbar.test.jsx`,
  `VaccineAlertBanner.test.jsx`, `ProtectedRoute.test.jsx`.
- `context/AuthContext.test.jsx` : état initial, login/logout, parsing du
  payload JWT, nettoyage si token corrompu.
- `services/api.test.js` (couche bas niveau) et `services/services.test.js`
  (couverture totale `dogService` + `eventService`).
- `pages/LoginPage.test.jsx`, `pages/RegisterPage.test.jsx`.
- Helper `test/renderWithRouter.jsx`.

### Refonte visuelle ("carnet de santé éditorial")

Direction : magazine raffiné pour animaux, palette argile chaude (cream +
terracotta + mousse), typographie serif caractérielle.

- **Typographie** : `Fraunces` (display, serif Google Fonts avec axes optical
  size / SOFT / WONK pour des italiques signées), `DM Sans` (corps), `DM Mono`
  (chiffres tabulaires).
- **Palette** (`--paper #F4ECDD`, `--ink #1C1814`, `--terracotta #BF5440`,
  `--moss #4A5D3F`, `--ochre #C68B3F`, `--plum #5A4756`) avec fond papier
  texturé en CSS pur (radial-gradient + grain).
- **Login/Register** : split layout, panneau gauche en encre profonde avec
  gradient terracotta/mousse, hero éditorial type magazine.
- **Dashboard** : eyebrow tracké + titre Fraunces géant, cartes-chien en grille
  (`minmax(420px, 1fr)`) avec animation `rise` en stagger, photos affichées en
  taille naturelle (sans crop), placeholder = monogramme italique 8-11rem.
- **Fiche chien** : photo polaroid avec rotation -1.2° + ruban washi décoratif
  qui se redresse au hover, stats en grille, calcul d'âge automatique.
- **EventRow** : date verticale (jour XL en Fraunces + mois/heure en mono),
  badge type avec point coloré et bordure.
- **Calendrier** : grille 7×N, jours en serif italique, dots colorés par type.
- **EventForm** : sélection du type en *type-pills* radio-button colorés
  (terracotta / moss / ochre / plum) au lieu d'un `<select>`.
- **HistoryView** : pagination en mono caps tracké, état vide avec ornement « ∅ ».
- **Détails** : boutons en pill avec ombre interne, focus ring terracotta 4px,
  back-link dont la flèche glisse au hover, `rule-ornament`, `::selection` en
  terracotta.

### Seed de données

`server/scripts/seed.js` (exposé via `npm run seed` côté server) appelle l'API
publiquement pour créer :

- 1 utilisateur de seed (`seed@dogcare.test` / `seedpass123`).
- 50 chiens, race et poids variés, 90% avec photo (cyclées parmi les images
  ≤5 Mo de `server/uploads/sample-dogs/`).
- ~1300 événements répartis sur tous les types et tous les cas fonctionnels :
  - 4 chiens spécifiquement « riches en historique » (>30 events passés) pour
    tester la pagination ;
  - vaccins distribués entre `overdue` (≤15 j passés), `upcoming` (1-30 j
    futurs) et lointains (60-300 j) pour les bannières ;
  - 2-4 événements dans le mois courant par chien pour les dots du calendrier ;
  - 1-3 événements futurs par chien pour le badge « X à venir ».

15 photos d'exemple ont été ajoutées dans `server/uploads/sample-dogs/`
(7 dépassent la limite multer de 5 Mo, le seed les filtre automatiquement).

### Infrastructure Azure et CI/CD Jenkins

Deux VMs Azure Ubuntu 24.04 (`Standard_B2ats_v2`) provisionnées :

| VM       | Région         | Rôle                                             |
|----------|----------------|--------------------------------------------------|
| backend  | France Central | Node API + Postgres en Docker (bind 127.0.0.1)   |
| frontend | Sweden Central | nginx servant le `dist/` Vite + proxy `/api`     |

Le nginx du frontend reverse-proxie `/api` et `/uploads` vers la VM backend, ce
qui rend l'application same-origin côté navigateur — **aucune configuration
CORS nécessaire**, le code React utilise les chemins relatifs `/api` qui lui
sont déjà familiers en dev.

#### Fichiers d'infra (`infra/`)

- `.env.deploy.example` — modèle de configuration locale (le vrai
  `.env.deploy` est gitignoré).
- `deploy.sh` — bootstrap one-shot des deux VMs depuis ta machine. Utilise
  `tar` over ssh (pas de dépendance à `rsync` qui n'est pas dans Git Bash).
- `provision-backend.sh` — script idempotent installé puis exécuté sur la VM
  backend : Node 20, Docker + docker-compose plugin, dossiers `/srv/`,
  `.env` API, démarrage Postgres, unité systemd, ufw (SSH + 3000).
- `provision-frontend.sh` — idem côté frontend : nginx, ufw (SSH + 80).
- `docker-compose.prod.yml` — Postgres 15 sur la VM backend, lié uniquement
  à `127.0.0.1:5432`.
- `dogcare-api.service` — unité systemd qui lit `/srv/dogcare-api/.env` et
  redémarre l'API en cas de crash.
- `nginx-frontend.conf.template` — site nginx avec placeholders
  `{{BACKEND_HOST}}` et `{{API_PORT}}` substitués au déploiement.
- `README.md` — guide pas-à-pas pour rejouer le bootstrap, configurer Jenkins
  et dépanner.

#### Jenkinsfiles

- `Jenkinsfile.backend` : checkout → `npm ci` → `eslint` → `jest` (avec un
  Postgres 15 jetable lancé en docker pendant la phase test, port 55432) →
  deploy SSH (tar streamé + `npm ci --omit=dev` + `systemctl restart
  dogcare-api` + smoke test). Deploy uniquement sur branche `main`.
- `Jenkinsfile.frontend` : checkout → `npm ci` → `eslint` → `vitest` →
  `vite build` → archivage `dist/` → deploy SSH (tar streamé + `nginx -s
  reload` + smoke test). Deploy uniquement sur `main`.

Les deux pipelines lisent leurs hôtes cibles via paramètres
(`BACKEND_HOST=20.199.44.62`, `FRONTEND_HOST=20.240.203.48`) et utilisent les
credentials SSH `dogcare-backend-ssh` et `dogcare-frontend-ssh` (à créer dans
Jenkins).

#### NSG Azure ouverts

| VM       | Port    | Source                              |
|----------|---------|-------------------------------------|
| backend  | 22      | `*` (déjà existant)                 |
| backend  | 3000    | IP du frontend (`20.240.203.48/32`) |
| frontend | 22      | `*` (déjà existant)                 |
| frontend | 80      | `*`                                 |

#### État final vérifié

- http://20.240.203.48 → HTTP 200, l'app React est servie.
- http://20.240.203.48/api/auth/register → user smoke testé créé en prod.
- http://20.240.203.48/api/auth/login + `GET /api/dogs` avec Bearer → OK.
- `systemctl is-active dogcare-api` sur la VM backend → `active`.
- Container `dogcare-db` up, Postgres reachable depuis l'API uniquement.

### Hygiène

- `.gitignore` enrichi : `*.pem`, `*.key`, `infra/.env.deploy`.
- Les clés SSH (`backend_key.pem`, `frontend_key.pem`) sont volontairement
  exclues du repo.
