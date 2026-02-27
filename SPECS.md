# DogCare — Spécifications Fonctionnelles Complètes

## 1. Présentation du projet

**DogCare** est une application web de type "carnet de santé numérique" pour chiens.
Un utilisateur peut enregistrer ses chiens, puis pour chaque chien, suivre ses vaccins, promenades, repas et rendez-vous vétérinaires via un historique et un calendrier.

### Stack technique

| Couche    | Technologie              |
|-----------|--------------------------|
| Frontend  | React (Vite)             |
| Backend   | Node.js + Express        |
| BDD       | PostgreSQL (requêtes SQL brutes via `pg`) |
| Auth      | JWT (JSON Web Token)     |
| Tests     | Jest (back) + React Testing Library (front) |
| CI/CD     | GitHub Actions           |

---

## 2. Utilisateurs et rôles

L'application n'a **qu'un seul rôle** : l'utilisateur standard.
Pas de rôle admin, pas de modération. Chaque utilisateur ne voit et ne gère que **ses propres chiens**.

---

## 3. Modèle de données

### 3.1 Schéma relationnel

```
users
  ├── id            (PK, UUID)
  ├── email         (UNIQUE, NOT NULL)
  ├── password_hash (NOT NULL)
  ├── first_name    (NOT NULL)
  ├── created_at    (TIMESTAMP, DEFAULT NOW())
  └── updated_at    (TIMESTAMP, DEFAULT NOW())

dogs
  ├── id            (PK, UUID)
  ├── user_id       (FK → users.id, ON DELETE CASCADE)
  ├── name          (NOT NULL)
  ├── breed         (nullable — race du chien)
  ├── birth_date    (DATE, nullable)
  ├── weight_kg     (DECIMAL, nullable)
  ├── photo_url     (TEXT, nullable — chemin relatif vers le fichier uploadé)
  ├── created_at    (TIMESTAMP, DEFAULT NOW())
  └── updated_at    (TIMESTAMP, DEFAULT NOW())

events
  ├── id            (PK, UUID)
  ├── dog_id        (FK → dogs.id, ON DELETE CASCADE)
  ├── type          (ENUM: 'vaccine', 'walk', 'meal', 'vet')
  ├── title         (NOT NULL — ex: "Vaccin rage", "Balade forêt")
  ├── description   (TEXT, nullable)
  ├── event_date    (TIMESTAMP, NOT NULL)
  ├── next_due_date (DATE, nullable — uniquement pour les vaccins)
  ├── created_at    (TIMESTAMP, DEFAULT NOW())
  └── updated_at    (TIMESTAMP, DEFAULT NOW())
```

### 3.2 Relations

```
users  1───N  dogs    → Un utilisateur possède 0 à N chiens
dogs   1───N  events  → Un chien possède 0 à N événements
```

La suppression d'un utilisateur supprime ses chiens (CASCADE).
La suppression d'un chien supprime ses événements (CASCADE).

### 3.3 Un événement = un chien (pas de many-to-many)

Un événement est **toujours rattaché à un seul chien**. Il n'y a pas de relation many-to-many entre `dogs` et `events`.

**Cas concret : promenade avec plusieurs chiens**

Si l'utilisateur promène Rex et Bella ensemble, l'application crée **2 events distincts** (un par chien). Chaque chien garde ainsi son propre historique complet et indépendant.

Pourquoi ce choix :
- Le modèle reste **linéaire** (`users → dogs → events`), sans table de jointure.
- L'historique par chien est autonome : on peut consulter "toutes les balades de Rex" sans logique de filtrage complexe.
- Chaque event peut avoir sa propre description (ex : "Rex a boité en fin de balade" vs "Bella en pleine forme").
- Le CRUD reste identique pour tous les types d'événements, pas de cas particulier.

**Facilité côté UX** : le formulaire d'ajout d'événement propose une sélection multiple de chiens. Si l'utilisateur coche Rex et Bella, le frontend envoie **2 requêtes POST** (une par chien) avec les mêmes infos. La duplication est transparente pour l'utilisateur.

### 3.4 Le champ `type` (événements)

| Type       | Description                                     | `next_due_date` utilisé ? |
|------------|-------------------------------------------------|---------------------------|
| `vaccine`  | Vaccination (rage, leptospirose, etc.)           | **Oui** — date du rappel  |
| `walk`     | Promenade (forêt, parc, etc.)                    | Non                       |
| `meal`     | Repas (type de croquettes, quantité, etc.)        | Non                       |
| `vet`      | Rendez-vous vétérinaire (contrôle, urgence, etc.) | Non                       |

---

## 4. Fonctionnalités détaillées

### 4.1 Authentification

#### Inscription (`POST /api/auth/register`)

| Champ      | Règles de validation                              |
|------------|---------------------------------------------------|
| email      | Format email valide, unique en BDD                |
| password   | Minimum 8 caractères                              |
| first_name | Non vide, max 50 caractères                       |

- Le mot de passe est hashé avec **bcrypt** (salt rounds = 10) avant stockage.
- En retour : un token JWT + les infos user (sans le password).

#### Connexion (`POST /api/auth/login`)

- L'utilisateur envoie email + password.
- On compare avec bcrypt.
- Si OK → retour d'un token JWT (expire dans **24h**).
- Si KO → erreur 401 "Email ou mot de passe incorrect" (message volontairement vague pour la sécurité).

#### Token JWT

- Payload : `{ userId, email }`
- Signé avec une clé secrète stockée en variable d'environnement (`JWT_SECRET`).
- Envoyé dans le header `Authorization: Bearer <token>` pour chaque requête protégée.
- Un middleware Express vérifie le token sur toutes les routes `/api/dogs` et `/api/events`.

---

### 4.2 Gestion des chiens (CRUD complet)

#### Créer un chien (`POST /api/dogs`)

```json
{
  "name": "Rex",
  "breed": "Berger Allemand",
  "birth_date": "2022-03-15",
  "weight_kg": 32.5
}
```

- `name` est obligatoire, le reste est optionnel.
- Le `user_id` est extrait automatiquement du token JWT (jamais envoyé par le client).

#### Lister ses chiens (`GET /api/dogs`)

- Retourne **uniquement** les chiens du user connecté.
- Trié par `created_at` décroissant (le plus récent en premier).
- Pour chaque chien, inclure le **nombre d'événements à venir** (pour affichage d'un badge).

#### Voir un chien (`GET /api/dogs/:id`)

- Retourne les infos du chien + ses **événements récents** (les 5 derniers).
- Si le chien n'appartient pas au user → 403 Forbidden.
- Si le chien n'existe pas → 404 Not Found.

#### Modifier un chien (`PUT /api/dogs/:id`)

- Mise à jour partielle autorisée (on ne met à jour que les champs envoyés).
- Mêmes vérifications de propriété (403 si pas le bon user).

#### Uploader / modifier la photo (`POST /api/dogs/:id/photo`)

- Envoi en `multipart/form-data` avec un champ `photo`.
- Le backend utilise **multer** pour réceptionner le fichier.
- Contraintes :
  - Types acceptés : `image/jpeg`, `image/png`, `image/webp`
  - Taille max : **5 Mo**
  - Un seul fichier par requête
- Le fichier est sauvegardé dans `server/uploads/dogs/` avec un nom unique (`uuid + extension`).
- Le chemin relatif est stocké dans `dogs.photo_url` (ex : `/uploads/dogs/a1b2c3.jpg`).
- Si le chien avait déjà une photo, l'ancienne est supprimée du disque.
- Le dossier `uploads/` est servi en statique par Express (`express.static`).

#### Supprimer un chien (`DELETE /api/dogs/:id`)

- Supprime le chien ET tous ses événements (CASCADE en BDD).
- Supprime aussi le fichier photo du disque si il existe.
- Vérification de propriété avant suppression.

---

### 4.3 Gestion des événements (CRUD complet)

#### Créer un événement (`POST /api/dogs/:dogId/events`)

```json
{
  "type": "vaccine",
  "title": "Vaccin rage",
  "description": "Rappel annuel chez Dr. Martin",
  "event_date": "2025-06-15T10:00:00Z",
  "next_due_date": "2026-06-15"
}
```

- Vérifier que le chien appartient bien au user connecté.
- `type` doit être l'une des 4 valeurs autorisées.
- `next_due_date` n'est pertinent que pour le type `vaccine` (ignoré sinon).

#### Lister les événements d'un chien (`GET /api/dogs/:dogId/events`)

- Filtrable par type via query param : `?type=vaccine`
- Trié par `event_date` décroissant.
- Vérification de propriété du chien.

#### Modifier un événement (`PUT /api/dogs/:dogId/events/:eventId`)

- On ne peut pas changer le `type` d'un événement (pour garder la cohérence).
- Vérification : l'event appartient bien au chien, qui appartient bien au user.

#### Supprimer un événement (`DELETE /api/dogs/:dogId/events/:eventId`)

- Même chaîne de vérification de propriété.

---

### 4.4 Calendrier

#### Endpoint (`GET /api/dogs/:dogId/events/calendar?month=2025-06`)

- Retourne tous les événements du chien pour le mois donné.
- Groupés par jour, format :

```json
{
  "2025-06-03": [
    { "id": "...", "type": "walk", "title": "Balade parc", "event_date": "..." }
  ],
  "2025-06-15": [
    { "id": "...", "type": "vaccine", "title": "Vaccin rage", "event_date": "..." }
  ]
}
```

- Le frontend affiche un calendrier mensuel simple avec des points colorés par type d'événement.

---

### 4.5 Historique

#### Endpoint (`GET /api/dogs/:dogId/events/history?page=1&limit=20`)

- Retourne tous les événements passés (où `event_date < NOW()`), paginés.
- Trié du plus récent au plus ancien.
- Réponse paginée :

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

### 4.6 Rappels de vaccins (bonus)

#### Endpoint (`GET /api/dogs/vaccines/upcoming`)

- Retourne **tous les vaccins de tous les chiens du user** dont le `next_due_date` est dans les **30 prochains jours** ou est **dépassé**.
- Format retour :

```json
[
  {
    "dog_name": "Rex",
    "dog_id": "...",
    "event_id": "...",
    "title": "Vaccin rage",
    "next_due_date": "2025-07-01",
    "days_remaining": 5,
    "status": "upcoming"
  },
  {
    "dog_name": "Bella",
    "dog_id": "...",
    "event_id": "...",
    "title": "Vaccin leptospirose",
    "next_due_date": "2025-06-20",
    "days_remaining": -3,
    "status": "overdue"
  }
]
```

- `status` : `"upcoming"` si dans le futur, `"overdue"` si la date est passée.
- Le frontend affiche ces rappels sous forme de **bannière d'alerte** sur le dashboard.

---

## 5. Structure des réponses API

### Succès

```json
{
  "success": true,
  "data": { ... }
}
```

### Erreur

```json
{
  "success": false,
  "error": {
    "message": "Description lisible de l'erreur",
    "code": "VALIDATION_ERROR"
  }
}
```

### Codes d'erreur utilisés

| Code HTTP | Code interne          | Quand                                    |
|-----------|-----------------------|------------------------------------------|
| 400       | `VALIDATION_ERROR`    | Champ manquant ou invalide               |
| 401       | `UNAUTHORIZED`        | Pas de token ou token expiré             |
| 403       | `FORBIDDEN`           | Accès à une ressource d'un autre user    |
| 404       | `NOT_FOUND`           | Ressource inexistante                    |
| 409       | `CONFLICT`            | Email déjà utilisé (inscription)         |
| 500       | `INTERNAL_ERROR`      | Erreur serveur inattendue                |

---

## 6. Pages Frontend (React)

### 6.1 Liste des pages

| Page               | Route                  | Description                                         |
|--------------------|------------------------|-----------------------------------------------------|
| Login              | `/login`               | Formulaire email + mot de passe                     |
| Register           | `/register`            | Formulaire inscription                              |
| Dashboard          | `/`                    | Liste des chiens + bannière rappels vaccins         |
| Fiche chien        | `/dogs/:id`            | Détail d'un chien + événements récents + actions    |
| Ajout/Édition chien| `/dogs/new`, `/dogs/:id/edit` | Formulaire chien                             |
| Calendrier         | `/dogs/:id/calendar`   | Vue calendrier mensuel des événements               |
| Historique         | `/dogs/:id/history`    | Liste paginée de tous les événements passés         |
| Ajout événement    | `/dogs/:id/events/new` | Formulaire événement (type sélectionnable)          |

### 6.2 Composants principaux

```
App
├── AuthLayout (pages login/register)
│   ├── LoginPage
│   └── RegisterPage
├── MainLayout (navbar + contenu protégé)
│   ├── Navbar (nom user, bouton déconnexion)
│   ├── Dashboard
│   │   ├── VaccineAlertBanner
│   │   └── DogCard (× N)
│   ├── DogDetail
│   │   ├── DogInfoSection
│   │   ├── RecentEventsList
│   │   └── ActionButtons (éditer, supprimer, ajouter event)
│   ├── DogForm (création + édition)
│   ├── EventForm
│   ├── CalendarView
│   │   └── CalendarDay (× 28-31)
│   └── HistoryView
│       └── EventRow (× N)
```

### 6.3 Navigation et logique

- **Route protégée** : si pas de token JWT en localStorage → redirection vers `/login`.
- **Après login** : redirection vers `/` (dashboard).
- **Navbar** : affichée sur toutes les pages sauf login/register. Contient le prénom du user et un bouton "Déconnexion" (supprime le token et redirige vers `/login`).
- **Dashboard** : la page d'accueil. Affiche en haut la bannière de rappels vaccins (si il y en a), puis la liste des chiens sous forme de cartes cliquables.

---

## 7. Arborescence du projet

```
dogcare/
├── client/                     # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   ├── pages/              # Composants de page
│   │   ├── services/           # Appels API (fetch/axios)
│   │   ├── context/            # AuthContext (gestion du token)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Node.js/Express
│   ├── src/
│   │   ├── routes/             # Définition des routes Express
│   │   │   ├── auth.js
│   │   │   ├── dogs.js
│   │   │   └── events.js
│   │   ├── middleware/         # Auth middleware (vérification JWT)
│   │   │   └── auth.js
│   │   ├── db/                 # Connexion PostgreSQL + requêtes SQL
│   │   │   ├── pool.js         # Config pg.Pool
│   │   │   ├── init.sql        # Script de création des tables
│   │   │   └── queries/        # Requêtes SQL organisées par entité
│   │   │       ├── users.js
│   │   │       ├── dogs.js
│   │   │       └── events.js
│   │   ├── validators/         # Validation des inputs
│   │   └── app.js              # Config Express (middlewares, routes)
│   ├── uploads/
│   │   └── dogs/               # Photos uploadées (gitignored)
│   ├── package.json
│   └── server.js               # Point d'entrée (lance le serveur)
│
├── .env.example                # Variables d'environnement attendues
├── .gitignore
├── docker-compose.yml          # PostgreSQL en container (optionnel)
└── README.md
```

---

## 8. Variables d'environnement

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dogcare
DB_USER=postgres
DB_PASSWORD=postgres

# Auth
JWT_SECRET=une-clé-secrète-longue-et-aléatoire
JWT_EXPIRES_IN=24h
```

---

## 9. Règles métier résumées

1. Un user ne peut voir/modifier/supprimer **que ses propres chiens et événements**.
2. Le champ `next_due_date` n'est utilisé que pour les événements de type `vaccine`.
3. Un vaccin est considéré **"à venir"** si `next_due_date` est dans les 30 prochains jours.
4. Un vaccin est considéré **"en retard"** si `next_due_date` est dans le passé.
5. La suppression est en cascade : supprimer un user → ses chiens → leurs événements.
6. Les mots de passe ne sont **jamais** retournés dans les réponses API.
7. L'email doit être **unique** (contrainte en BDD + vérification applicative).
8. Les dates sont stockées et échangées en **UTC** (format ISO 8601).

---

## 10. Pipeline CI/CD (GitHub Actions)

Le projet inclura un pipeline qui s'exécute à chaque push :

1. **Lint** — vérification du style de code (ESLint)
2. **Tests backend** — Jest sur les routes et la logique métier
3. **Tests frontend** — React Testing Library sur les composants clés
4. **Build** — vérification que le front compile sans erreur

---

## 11. Ce qui est hors périmètre

Pour garder le projet réaliste et faisable :

- ✅ Upload de photo du chien (stockage local via `multer`)
- ❌ Pas de notifications email/push
- ❌ Pas de rôle admin
- ❌ Pas de partage de chien entre utilisateurs
- ❌ Pas de mode hors-ligne
- ❌ Pas de PWA
- ❌ Pas d'internationalisation (app en français uniquement)
