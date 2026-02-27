# DogCare — Spécifications Techniques

---

> ## CRITICAL RULES — MUST BE FOLLOWED AT ALL TIMES
>
> ### 1. English only — Zero French in the codebase
>
> **Every single character** of the codebase MUST be in **English**. This is a non-negotiable rule that applies to:
>
> - Variable names, function names, class names, component names
> - Comments (inline, block, and file headers)
> - JSDoc documentation
> - Error messages returned by the API (e.g. `"Invalid email or password"`, NOT `"Email ou mot de passe incorrect"`)
> - Validation messages (e.g. `"Password must be at least 8 characters"`)
> - Console logs, debug messages
> - Commit messages
> - File names and folder names
> - Git branch names
> - README and documentation files
> - Test descriptions (`describe`, `it`, `test`)
> - JSX text content and UI labels (the app UI is in French per the functional specs, **this is the ONLY exception** — user-facing UI strings in React components may be in French)
>
> **If in doubt: use English.** The only French allowed is the user-facing text rendered in the browser (button labels, page titles, form placeholders, etc.).
>
> ### 2. JSDoc — Every function must be documented
>
> **Every function, method, and module** MUST have a JSDoc comment block. No exceptions.
>
> This applies to:
> - All Express route handlers
> - All middleware functions
> - All database query functions (`server/src/db/queries/*.js`)
> - All validator definitions
> - All React components (use `@param {Object} props`)
> - All service functions (`client/src/services/*.js`)
> - All utility/helper functions
> - All context providers and custom hooks
>
> **JSDoc format to follow:**
>
> ```js
> /**
>  * Short description of what the function does.
>  *
>  * @param {string} email - The user's email address
>  * @param {string} password - The user's plain text password
>  * @returns {Promise<Object>} The created user object (without password_hash)
>  * @throws {Error} If the email is already in use (409 CONFLICT)
>  */
> ```
>
> For React components:
>
> ```jsx
> /**
>  * Displays a card with summary information about a dog.
>  *
>  * @param {Object} props
>  * @param {Object} props.dog - The dog object
>  * @param {string} props.dog.id - The dog's UUID
>  * @param {string} props.dog.name - The dog's name
>  * @param {string} [props.dog.photo_url] - Optional photo URL
>  * @param {number} props.dog.upcoming_events_count - Number of upcoming events
>  * @returns {JSX.Element}
>  */
> ```
>
> **These two rules are the highest priority requirements of this project. Any code that violates them must be rejected in code review.**

---

## 1. Architecture générale

```
┌──────────────────┐       HTTP/JSON       ┌──────────────────┐       SQL        ┌──────────────┐
│   Client React   │  ◄──────────────────► │  API Express.js  │ ◄──────────────► │  PostgreSQL   │
│   (Vite, :5173)  │    localhost:3000     │   (Node.js)      │   localhost:5432 │               │
└──────────────────┘                       └──────────────────┘                  └──────────────┘
                                                   │
                                                   ├── /uploads/dogs/  (fichiers statiques)
                                                   └── JWT (auth stateless)
```

### Stack technique détaillée

| Couche         | Technologie                | Version minimale |
|----------------|----------------------------|------------------|
| Runtime        | Node.js                    | 18 LTS           |
| Backend        | Express.js                 | 4.x              |
| Base de données| PostgreSQL                 | 15+              |
| Driver BDD     | pg (node-postgres)         | 8.x              |
| Auth           | jsonwebtoken + bcrypt      | —                |
| Upload         | multer                     | 1.x              |
| Validation     | express-validator          | 7.x              |
| Frontend       | React                      | 18.x             |
| Bundler        | Vite                       | 5.x              |
| Routage client | react-router-dom           | 6.x              |
| HTTP client    | fetch (natif)              | —                |
| Tests back     | Jest + supertest           | —                |
| Tests front    | Vitest + React Testing Lib | —                |
| Lint           | ESLint                     | 8.x              |
| CI/CD          | GitHub Actions             | —                |
| Conteneur BDD  | Docker (docker-compose)    | optionnel        |

---

## 2. Structure du projet

```
dogcare/
├── client/                          # Frontend React (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/              # Composants réutilisables
│   │   │   ├── Navbar.jsx
│   │   │   ├── DogCard.jsx
│   │   │   ├── VaccineAlertBanner.jsx
│   │   │   ├── EventRow.jsx
│   │   │   ├── CalendarDay.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/                   # Pages (une par route)
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DogDetail.jsx
│   │   │   ├── DogForm.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   └── HistoryView.jsx
│   │   ├── services/                # Couche d'appel API
│   │   │   ├── api.js               # Instance fetch configurée (base URL + token)
│   │   │   ├── authService.js
│   │   │   ├── dogService.js
│   │   │   └── eventService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Context React pour l'auth (token + user)
│   │   ├── App.jsx                  # Routage principal
│   │   └── main.jsx                 # Point d'entrée React
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Backend Node.js / Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js              # POST /register, POST /login
│   │   │   ├── dogs.js              # CRUD /api/dogs
│   │   │   └── events.js            # CRUD /api/dogs/:dogId/events
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification
│   │   ├── db/
│   │   │   ├── pool.js              # pg.Pool configuration
│   │   │   ├── init.sql             # DDL: table creation + ENUM types
│   │   │   └── queries/
│   │   │       ├── users.js         # SQL queries for users
│   │   │       ├── dogs.js          # SQL queries for dogs
│   │   │       └── events.js        # SQL queries for events
│   │   ├── validators/
│   │   │   ├── auth.js              # Validation rules for register/login
│   │   │   ├── dogs.js              # Validation rules for dogs
│   │   │   └── events.js            # Validation rules for events
│   │   └── app.js                   # Express config (middlewares, routes, static)
│   ├── uploads/
│   │   └── dogs/                    # Uploaded photos (.gitignored)
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── dogs.test.js
│   │   └── events.test.js
│   ├── package.json
│   └── server.js                    # Entry point: starts app.listen()
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 3. Base de données — PostgreSQL

### 3.1 Script d'initialisation (`server/src/db/init.sql`)

```sql
-- Extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM type for events
CREATE TYPE event_type AS ENUM ('vaccine', 'walk', 'meal', 'vet');

-- Table users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(50) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table dogs
CREATE TABLE dogs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    breed         VARCHAR(100),
    birth_date    DATE,
    weight_kg     DECIMAL(5, 2),
    photo_url     TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table events
CREATE TABLE events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id        UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    type          event_type NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    event_date    TIMESTAMP WITH TIME ZONE NOT NULL,
    next_due_date DATE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for frequently used queries
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_events_dog_id ON events(dog_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_next_due_date ON events(next_due_date);
```

### 3.2 Connexion (`server/src/db/pool.js`)

```js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
```

- Raw SQL queries via `pool.query()` — no ORM.
- Parameterized queries (`$1`, `$2`...) used systematically to prevent SQL injection.

### 3.3 Organisation des requêtes SQL (`server/src/db/queries/`)

Each file exports functions that execute SQL queries and return results.

**Example — `dogs.js`:**

```js
const pool = require('../pool');

const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT d.*,
            COUNT(e.id) FILTER (WHERE e.event_date > NOW()) AS upcoming_events_count
     FROM dogs d
     LEFT JOIN events e ON e.dog_id = d.id
     WHERE d.user_id = $1
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query('SELECT * FROM dogs WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async ({ userId, name, breed, birthDate, weightKg }) => {
  const result = await pool.query(
    `INSERT INTO dogs (user_id, name, breed, birth_date, weight_kg)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, breed, birthDate, weightKg]
  );
  return result.rows[0];
};

const update = async (id, fields) => {
  // Construction dynamique du SET avec les champs fournis
  const entries = Object.entries(fields);
  const setClause = entries.map(([key, _], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([_, val]) => val);
  values.push(id);

  const result = await pool.query(
    `UPDATE dogs SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query('DELETE FROM dogs WHERE id = $1', [id]);
};

module.exports = { findByUserId, findById, create, update, remove };
```

---

## 4. Backend — API Express

### 4.1 Configuration Express (`server/src/app.js`)

```js
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dogRoutes = require('./routes/dogs');
const eventRoutes = require('./routes/events');

const app = express();

// Middlewares globaux
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Fichiers statiques (photos uploadées)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dogs', dogRoutes);
app.use('/api/events', eventRoutes);

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' }
  });
});

module.exports = app;
```

### 4.2 Point d'entrée (`server/server.js`)

```js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.3 Middleware d'authentification (`server/src/middleware/auth.js`)

```js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token manquant', code: 'UNAUTHORIZED' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token invalide ou expiré', code: 'UNAUTHORIZED' }
    });
  }
};

module.exports = authenticate;
```

---

## 5. Routes API — Spécification complète

### 5.1 Authentification (`/api/auth`)

| Méthode | Route                | Auth | Description                |
|---------|----------------------|------|----------------------------|
| POST    | `/api/auth/register` | Non  | Inscription d'un nouvel utilisateur |
| POST    | `/api/auth/login`    | Non  | Connexion et obtention du token JWT |

#### `POST /api/auth/register`

**Request body :**
```json
{
  "email": "user@example.com",
  "password": "monMotDePasse123",
  "first_name": "Jean"
}
```

**Validation (express-validator) :**
- `email` : `isEmail()`, `normalizeEmail()`
- `password` : `isLength({ min: 8 })`
- `first_name` : `notEmpty()`, `isLength({ max: 50 })`, `trim()`

**Logique :**
1. Vérifier que l'email n'existe pas déjà en BDD → sinon `409 CONFLICT`
2. Hasher le mot de passe avec `bcrypt.hash(password, 10)`
3. Insérer l'utilisateur en BDD
4. Générer un JWT : `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' })`
5. Retourner le token + les infos user (sans password_hash)

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "Jean",
      "created_at": "2025-06-01T12:00:00.000Z"
    }
  }
}
```

#### `POST /api/auth/login`

**Request body :**
```json
{
  "email": "user@example.com",
  "password": "monMotDePasse123"
}
```

**Logique :**
1. Chercher l'utilisateur par email → sinon `401`
2. Comparer le mot de passe avec `bcrypt.compare()` → sinon `401`
3. Message d'erreur identique dans les deux cas : `"Email ou mot de passe incorrect"` (sécurité)
4. Générer et retourner un JWT

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "Jean"
    }
  }
}
```

---

### 5.2 Chiens (`/api/dogs`)

Toutes les routes ci-dessous nécessitent le middleware `authenticate`.

| Méthode | Route                     | Description                        |
|---------|---------------------------|------------------------------------|
| GET     | `/api/dogs`               | Lister les chiens du user connecté |
| POST    | `/api/dogs`               | Créer un chien                     |
| GET     | `/api/dogs/:id`           | Détail d'un chien                  |
| PUT     | `/api/dogs/:id`           | Modifier un chien                  |
| DELETE  | `/api/dogs/:id`           | Supprimer un chien                 |
| POST    | `/api/dogs/:id/photo`     | Uploader/modifier la photo         |

#### `GET /api/dogs`

**Logique :**
1. Récupérer `req.user.userId` depuis le JWT
2. Requête SQL : tous les chiens du user avec `COUNT` des événements futurs (badge)
3. Tri par `created_at DESC`

**Response 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rex",
      "breed": "Berger Allemand",
      "birth_date": "2022-03-15",
      "weight_kg": 32.5,
      "photo_url": "/uploads/dogs/a1b2c3.jpg",
      "upcoming_events_count": 3,
      "created_at": "2025-01-10T10:00:00.000Z"
    }
  ]
}
```

#### `POST /api/dogs`

**Request body :**
```json
{
  "name": "Rex",
  "breed": "Berger Allemand",
  "birth_date": "2022-03-15",
  "weight_kg": 32.5
}
```

**Validation :**
- `name` : `notEmpty()`, `isLength({ max: 100 })`, `trim()`
- `breed` : `optional()`, `isLength({ max: 100 })`, `trim()`
- `birth_date` : `optional()`, `isISO8601()` (format `YYYY-MM-DD`)
- `weight_kg` : `optional()`, `isFloat({ min: 0, max: 200 })`

**Response 201 :**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Rex", ... }
}
```

#### `GET /api/dogs/:id`

**Logique :**
1. Récupérer le chien par ID
2. Vérifier `dog.user_id === req.user.userId` → sinon `403 FORBIDDEN`
3. Récupérer les 5 derniers événements du chien
4. Retourner le chien + ses événements récents

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Rex",
    "breed": "Berger Allemand",
    "birth_date": "2022-03-15",
    "weight_kg": 32.5,
    "photo_url": "/uploads/dogs/a1b2c3.jpg",
    "recent_events": [
      { "id": "uuid", "type": "walk", "title": "Balade forêt", "event_date": "..." }
    ]
  }
}
```

#### `PUT /api/dogs/:id`

**Request body (partiel autorisé) :**
```json
{
  "name": "Rex II",
  "weight_kg": 34.0
}
```

**Logique :**
1. Vérifier propriété du chien → sinon `403`
2. Construire dynamiquement la requête `UPDATE` avec uniquement les champs envoyés
3. Mettre à jour `updated_at`

#### `POST /api/dogs/:id/photo`

**Configuration multer :**
```js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/dogs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo
});
```

**Logique :**
1. Vérifier propriété du chien
2. Recevoir le fichier via `upload.single('photo')`
3. Si le chien avait une photo → supprimer l'ancien fichier du disque (`fs.unlink`)
4. Mettre à jour `dogs.photo_url` en BDD avec le nouveau chemin
5. Retourner le chien mis à jour

#### `DELETE /api/dogs/:id`

**Logique :**
1. Vérifier propriété → `403`
2. Si `photo_url` existe → supprimer le fichier du disque
3. `DELETE FROM dogs WHERE id = $1` (CASCADE supprime les events)

---

### 5.3 Événements (`/api/dogs/:dogId/events`)

Toutes les routes nécessitent `authenticate` + vérification que le chien appartient au user.

| Méthode | Route                                             | Description                     |
|---------|---------------------------------------------------|---------------------------------|
| GET     | `/api/dogs/:dogId/events`                         | Lister les événements (filtrable) |
| POST    | `/api/dogs/:dogId/events`                         | Créer un événement              |
| PUT     | `/api/dogs/:dogId/events/:eventId`                | Modifier un événement           |
| DELETE  | `/api/dogs/:dogId/events/:eventId`                | Supprimer un événement          |
| GET     | `/api/dogs/:dogId/events/calendar?month=YYYY-MM`  | Événements du mois (calendrier) |
| GET     | `/api/dogs/:dogId/events/history?page=1&limit=20` | Historique paginé               |
| GET     | `/api/dogs/vaccines/upcoming`                     | Rappels vaccins (tous les chiens) |

#### `POST /api/dogs/:dogId/events`

**Request body :**
```json
{
  "type": "vaccine",
  "title": "Vaccin rage",
  "description": "Rappel annuel chez Dr. Martin",
  "event_date": "2025-06-15T10:00:00Z",
  "next_due_date": "2026-06-15"
}
```

**Validation :**
- `type` : `isIn(['vaccine', 'walk', 'meal', 'vet'])`
- `title` : `notEmpty()`, `isLength({ max: 255 })`, `trim()`
- `description` : `optional()`, `trim()`
- `event_date` : `isISO8601()`
- `next_due_date` : `optional()`, `isISO8601()` — ignoré si `type !== 'vaccine'`

#### `GET /api/dogs/:dogId/events?type=vaccine`

**Query params :**
- `type` (optionnel) : filtre par type d'événement

**SQL :**
```sql
SELECT * FROM events
WHERE dog_id = $1
  AND ($2::event_type IS NULL OR type = $2)
ORDER BY event_date DESC;
```

#### `PUT /api/dogs/:dogId/events/:eventId`

- Le champ `type` ne peut **pas** être modifié (rejeté s'il est présent dans le body)
- Vérifier que l'event appartient bien au chien

#### `GET /api/dogs/:dogId/events/calendar?month=2025-06`

**Logique :**
1. Parser le paramètre `month` → début et fin du mois
2. Requête : `WHERE dog_id = $1 AND event_date >= $2 AND event_date < $3`
3. Grouper les résultats par jour (`DATE(event_date)`) côté applicatif

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "2025-06-03": [
      { "id": "uuid", "type": "walk", "title": "Balade parc", "event_date": "..." }
    ],
    "2025-06-15": [
      { "id": "uuid", "type": "vaccine", "title": "Vaccin rage", "event_date": "..." }
    ]
  }
}
```

#### `GET /api/dogs/:dogId/events/history?page=1&limit=20`

**Logique :**
1. Paramètres : `page` (défaut 1), `limit` (défaut 20, max 100)
2. Requête paginée avec `OFFSET` et `LIMIT`
3. Compter le total avec `COUNT(*)`

**SQL :**
```sql
-- Comptage total
SELECT COUNT(*) FROM events WHERE dog_id = $1 AND event_date < NOW();

-- Résultats paginés
SELECT * FROM events
WHERE dog_id = $1 AND event_date < NOW()
ORDER BY event_date DESC
LIMIT $2 OFFSET $3;
```

**Response 200 :**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

#### `GET /api/dogs/vaccines/upcoming`

**SQL :**
```sql
SELECT
  d.name AS dog_name,
  d.id AS dog_id,
  e.id AS event_id,
  e.title,
  e.next_due_date,
  (e.next_due_date - CURRENT_DATE) AS days_remaining,
  CASE
    WHEN e.next_due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'upcoming'
  END AS status
FROM events e
JOIN dogs d ON d.id = e.dog_id
WHERE d.user_id = $1
  AND e.type = 'vaccine'
  AND e.next_due_date IS NOT NULL
  AND e.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY e.next_due_date ASC;
```

---

## 6. Validation des entrées (`server/src/validators/`)

Utilisation d'`express-validator` pour centraliser les règles de validation.

### `validators/auth.js`

```js
const { body } = require('express-validator');

const registerRules = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères'),
  body('first_name').trim().notEmpty().withMessage('Le prénom est requis').isLength({ max: 50 }),
];

const loginRules = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

module.exports = { registerRules, loginRules };
```

### Middleware de traitement des erreurs de validation

```js
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: errors.array()[0].msg,
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};
```

---

## 7. Format uniforme des réponses API

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
    "message": "Description lisible",
    "code": "CODE_ERREUR"
  }
}
```

### Table des codes d'erreur

| HTTP | Code interne       | Cas d'usage                              |
|------|--------------------|------------------------------------------|
| 400  | VALIDATION_ERROR   | Champ manquant, format invalide          |
| 401  | UNAUTHORIZED       | Token absent, expiré ou invalide         |
| 403  | FORBIDDEN          | Accès à une ressource d'un autre user    |
| 404  | NOT_FOUND          | Ressource inexistante                    |
| 409  | CONFLICT           | Email déjà utilisé (inscription)         |
| 500  | INTERNAL_ERROR     | Erreur serveur inattendue                |

---

## 8. Frontend — React (Vite)

### 8.1 Configuration Vite (`client/vite.config.js`)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    }
  }
});
```

Le proxy Vite redirige les appels `/api/*` et `/uploads/*` vers le backend Express en développement, évitant les problèmes CORS.

### 8.2 Gestion de l'authentification (`context/AuthContext.jsx`)

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Décoder le payload JWT pour obtenir les infos user
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ userId: payload.userId, email: payload.email });
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 8.3 Service API (`services/api.js`)

```js
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw data.error;
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
```

### 8.4 Routage (`App.jsx`)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DogDetail from './pages/DogDetail';
import DogForm from './pages/DogForm';
import EventForm from './pages/EventForm';
import CalendarView from './pages/CalendarView';
import HistoryView from './pages/HistoryView';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dogs/new" element={<DogForm />} />
              <Route path="/dogs/:id" element={<DogDetail />} />
              <Route path="/dogs/:id/edit" element={<DogForm />} />
              <Route path="/dogs/:id/events/new" element={<EventForm />} />
              <Route path="/dogs/:id/calendar" element={<CalendarView />} />
              <Route path="/dogs/:id/history" element={<HistoryView />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 8.5 Route protégée (`components/ProtectedRoute.jsx`)

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
}
```

### 8.6 Arbre de composants

```
App
├── AuthProvider (context)
│
├── Routes publiques
│   ├── LoginPage
│   │   └── Formulaire : email + password → POST /api/auth/login
│   └── RegisterPage
│       └── Formulaire : email + password + first_name → POST /api/auth/register
│
└── Routes protégées (ProtectedRoute → vérifie token)
    └── MainLayout (Navbar + Outlet)
        ├── Navbar
        │   ├── Prénom de l'utilisateur
        │   ├── Lien vers Dashboard
        │   └── Bouton Déconnexion (supprime token → /login)
        │
        ├── Dashboard (/)
        │   ├── VaccineAlertBanner → GET /api/dogs/vaccines/upcoming
        │   │   └── Liste des vaccins à venir / en retard
        │   └── DogCard (× N) → GET /api/dogs
        │       ├── Photo, nom, race
        │       ├── Badge nombre d'événements à venir
        │       └── Clic → /dogs/:id
        │
        ├── DogDetail (/dogs/:id) → GET /api/dogs/:id
        │   ├── DogInfoSection (photo, nom, race, poids, date naissance)
        │   ├── RecentEventsList (5 derniers événements)
        │   └── ActionButtons
        │       ├── Éditer → /dogs/:id/edit
        │       ├── Supprimer → DELETE /api/dogs/:id (avec confirmation)
        │       ├── Ajouter événement → /dogs/:id/events/new
        │       ├── Calendrier → /dogs/:id/calendar
        │       └── Historique → /dogs/:id/history
        │
        ├── DogForm (/dogs/new ou /dogs/:id/edit)
        │   ├── Champs : name, breed, birth_date, weight_kg, photo
        │   ├── Mode création → POST /api/dogs puis POST photo
        │   └── Mode édition → PUT /api/dogs/:id
        │
        ├── EventForm (/dogs/:id/events/new)
        │   ├── Champs : type (select), title, description, event_date, next_due_date
        │   ├── next_due_date visible uniquement si type === 'vaccine'
        │   └── Submit → POST /api/dogs/:dogId/events
        │
        ├── CalendarView (/dogs/:id/calendar)
        │   ├── Navigation mois précédent / suivant
        │   ├── Grille 7×5 (lun-dim)
        │   └── CalendarDay (× 28-31)
        │       └── Points colorés par type d'événement
        │           🟢 walk | 🔵 vaccine | 🟡 meal | 🔴 vet
        │
        └── HistoryView (/dogs/:id/history)
            ├── Liste paginée des événements passés
            ├── EventRow (× N) : type (icône), titre, date, description
            └── Pagination (précédent / suivant / numéros de page)
```

---

## 9. Sécurité

| Risque                  | Mesure                                                        |
|-------------------------|---------------------------------------------------------------|
| Injection SQL           | Requêtes paramétrées (`$1`, `$2`) via `pg` — jamais de concaténation |
| XSS                     | React échappe par défaut le contenu rendu. Pas de `dangerouslySetInnerHTML` |
| CSRF                    | API stateless (JWT dans header Authorization, pas de cookies) |
| Brute force login       | Rate limiting avec `express-rate-limit` sur `/api/auth/*` (100 req/15min) |
| Upload malveillant      | Vérification du MIME type + taille max 5 Mo via multer        |
| Accès non autorisé      | Vérification systématique de propriété (user → dog → event)   |
| Fuite de mot de passe   | `password_hash` jamais retourné dans les réponses API         |
| Token côté client       | Stocké en `localStorage` — acceptable pour ce projet          |
| Secret JWT              | Stocké en variable d'environnement, jamais commité            |

---

## 10. Tests

### 10.1 Backend — Jest + Supertest

**Fichier de config : `server/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
```

**Structure des tests :**

```
server/tests/
├── auth.test.js       # Tests inscription, login, token invalide
├── dogs.test.js       # Tests CRUD chiens, vérification propriété
└── events.test.js     # Tests CRUD événements, calendrier, historique, vaccins
```

**Cas de test principaux :**

| Module | Test                                                   |
|--------|--------------------------------------------------------|
| Auth   | Inscription avec données valides → 201 + token        |
| Auth   | Inscription avec email existant → 409                  |
| Auth   | Inscription avec password trop court → 400             |
| Auth   | Login valide → 200 + token                             |
| Auth   | Login avec mauvais password → 401                      |
| Auth   | Accès route protégée sans token → 401                  |
| Dogs   | Créer un chien → 201                                   |
| Dogs   | Lister ses chiens → retourne uniquement les siens      |
| Dogs   | Accéder au chien d'un autre user → 403                 |
| Dogs   | Modifier un chien → 200 + champs mis à jour            |
| Dogs   | Supprimer un chien → 204 + cascade events              |
| Events | Créer un événement → 201                               |
| Events | Lister avec filtre type → résultats filtrés            |
| Events | Calendrier pour un mois → groupé par jour              |
| Events | Historique paginé → pagination correcte                |
| Events | Vaccins à venir → upcoming + overdue                   |

**Approche :**
- Base de test séparée (`dogcare_test`)
- Avant chaque suite : `TRUNCATE` des tables
- Utilisation de `supertest` pour appeler l'API Express directement

### 10.2 Frontend — Vitest + React Testing Library

**Cas de test principaux :**

| Composant          | Test                                                    |
|--------------------|---------------------------------------------------------|
| LoginPage          | Affiche le formulaire, soumet, redirige vers dashboard  |
| RegisterPage       | Affiche le formulaire, valide les champs                |
| Dashboard          | Affiche les DogCards, affiche la bannière vaccins       |
| DogCard            | Affiche nom, race, photo, badge events                  |
| DogDetail          | Affiche les infos du chien, les événements récents      |
| ProtectedRoute     | Redirige vers /login si pas de token                    |
| VaccineAlertBanner | Affiche les vaccins upcoming et overdue                 |
| CalendarView       | Affiche les jours avec points colorés                   |

---

## 11. Variables d'environnement

**Fichier `.env.example` :**

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
JWT_SECRET=change-me-in-production-use-a-long-random-string
JWT_EXPIRES_IN=24h

# Client (pour CORS)
CLIENT_URL=http://localhost:5173
```

---

## 12. Docker Compose (PostgreSQL)

**`docker-compose.yml` :**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dogcare
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./server/src/db/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  pgdata:
```

---

## 13. Pipeline CI/CD — GitHub Actions

**`.github/workflows/ci.yml` :**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install server deps
        run: cd server && npm ci
      - name: Install client deps
        run: cd client && npm ci
      - name: Lint server
        run: cd server && npx eslint src/
      - name: Lint client
        run: cd client && npx eslint src/

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: dogcare_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd server && npm ci
      - name: Init test DB
        run: PGPASSWORD=postgres psql -h localhost -U postgres -d dogcare_test -f server/src/db/init.sql
      - name: Run tests
        run: cd server && npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: dogcare_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          JWT_SECRET: test-secret
          JWT_EXPIRES_IN: 24h

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd client && npm ci
      - name: Run tests
        run: cd client && npm test -- --run

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd client && npm ci
      - name: Build frontend
        run: cd client && npm run build
```

---

## 14. Scripts NPM

### `server/package.json`

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --forceExit --detectOpenHandles",
    "lint": "eslint src/"
  }
}
```

### `client/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/"
  }
}
```

---

## 15. Dépendances

### Backend (`server/package.json`)

| Package              | Rôle                                   |
|----------------------|----------------------------------------|
| express              | Framework HTTP                         |
| pg                   | Driver PostgreSQL                      |
| bcrypt               | Hashage des mots de passe              |
| jsonwebtoken         | Génération et vérification JWT         |
| multer               | Upload de fichiers (multipart)         |
| cors                 | Gestion du CORS                        |
| dotenv               | Chargement des variables d'environnement |
| express-validator    | Validation des entrées                 |
| express-rate-limit   | Rate limiting (protection brute force) |
| uuid                 | Génération de noms de fichiers uniques |
| **Dev**              |                                        |
| jest                 | Framework de test                      |
| supertest            | Tests HTTP sur Express                 |
| nodemon              | Redémarrage auto en développement      |
| eslint               | Linter JavaScript                      |

### Frontend (`client/package.json`)

| Package                    | Rôle                              |
|----------------------------|-----------------------------------|
| react                      | Bibliothèque UI                   |
| react-dom                  | Rendu DOM                         |
| react-router-dom           | Routage côté client               |
| **Dev**                    |                                   |
| vite                       | Bundler / serveur de dev          |
| @vitejs/plugin-react       | Plugin React pour Vite            |
| vitest                     | Framework de test                 |
| @testing-library/react     | Tests de composants React         |
| @testing-library/jest-dom  | Matchers DOM pour les assertions  |
| jsdom                      | Environnement DOM pour Vitest     |
| eslint                     | Linter JavaScript                 |
| eslint-plugin-react        | Règles ESLint pour React          |
