/* eslint-disable no-console */
/**
 * Seed script — populates the running API with rich fake data.
 *
 * Usage:
 *   1. Make sure the backend is running on http://localhost:3000
 *   2. Run: node server/scripts/seed.js
 *
 * Behaviour:
 *   - Registers (or logs in) a fixed "seed" user.
 *   - Deletes every dog already owned by that user (cascade kills events).
 *   - Creates 50 dogs, each with a photo cycled from server/uploads/sample-dogs.
 *   - Creates a rich, realistic event timeline per dog covering:
 *       * past events (history pagination)
 *       * future events ("à venir" badges)
 *       * current-month events (calendar dots)
 *       * vaccines that are overdue, upcoming, and far-future
 */

const fs = require('fs');
const path = require('path');

const API = process.env.API_URL || 'http://localhost:3000';
const SEED_USER = {
  email: 'seed@dogcare.test',
  password: 'seedpass123',
  first_name: 'Marie',
};

const SAMPLE_DIR = path.join(__dirname, '..', 'uploads', 'sample-dogs');

const DOG_NAMES = [
  'Rex', 'Bella', 'Max', 'Luna', 'Charlie', 'Lucy', 'Cooper', 'Daisy',
  'Buddy', 'Molly', 'Rocky', 'Sadie', 'Bailey', 'Lola', 'Bear', 'Sophie',
  'Duke', 'Chloé', 'Tucker', 'Lily', 'Jack', 'Zoé', 'Oliver', 'Maggie',
  'Gus', 'Penny', 'Loki', 'Ruby', 'Finn', 'Roxy', 'Toby', 'Coco',
  'Murphy', 'Stella', 'Milo', 'Nala', 'Buster', 'Mia', 'Leo', 'Piper',
  'Sam', 'Olive', 'Bruno', 'Mocha', 'Otis', 'Hazel', 'Diesel', 'Rosie',
  'Hank', 'Willow',
];

const BREEDS = [
  'Berger Allemand', 'Labrador', 'Golden Retriever', 'Bouledogue Français',
  'Caniche', 'Beagle', 'Husky Sibérien', 'Cavalier King Charles',
  'Border Collie', 'Yorkshire Terrier', 'Chihuahua', 'Shih Tzu',
  'Cocker Spaniel', 'Boxer', 'Doberman', 'Rottweiler', 'Bouvier Bernois',
  'Jack Russell', 'Teckel', 'Carlin', 'Setter Anglais', 'Berger Australien',
  'Akita Inu', 'Shiba Inu', 'Bichon Frisé', 'Westie', 'Saint-Bernard',
  'Dogue Allemand', 'Croisé', null, // some without breed
];

const VACCINE_TITLES = [
  'Vaccin antirage', 'Vaccin Carré', 'Vaccin Lyme',
  'Vaccin Toux du chenil', 'Vaccin Leptospirose',
  'Vaccin Hépatite', 'Vaccin Parvovirose',
];

const WALK_TITLES = [
  'Balade en forêt', 'Promenade au parc', 'Course matinale',
  'Sortie plage', 'Balade en montagne', 'Tour du quartier',
  'Sortie en ville', 'Balade au lac', 'Randonnée', 'Course du soir',
  'Promenade en bord de Seine', 'Sortie au bois de Boulogne',
];

const MEAL_TITLES = [
  'Croquettes Royal Canin', 'Nourriture humide', 'Friandise dressage',
  'Os à mâcher', 'Repas riche en protéines', 'Croquettes saumon',
  'Pâtée poulet et légumes', 'Nouvelle gamme bio', 'Croquettes hypoallergéniques',
  'Repas spécial junior', 'Os de buffle',
];

const VET_TITLES = [
  'Visite annuelle', 'Contrôle dentaire', 'Détartrage',
  'Toilettage complet', 'Vermifuge', 'Stérilisation',
  'Consultation urgence', 'Antiparasitaire', 'Bilan sanguin',
  'Échographie', 'Coupe des griffes', 'Vérification poids',
];

const DESCRIPTIONS = {
  vaccine: [
    'Rappel annuel chez Dr. Martin.',
    'Vaccination effectuée sans souci.',
    'Léger gonflement au point d\'injection, normal.',
    'Carnet de santé mis à jour.',
    null, null,
  ],
  walk: [
    'A bien couru pendant 45 minutes.',
    'A rencontré un autre chien sympa.',
    'Très joueur aujourd\'hui.',
    'Il pleuvait, balade écourtée.',
    'A retrouvé un bâton qu\'il adore.',
    'Calme et tranquille.',
    null, null, null,
  ],
  meal: [
    '300g de croquettes.',
    'A laissé un peu dans la gamelle.',
    'Très en appétit.',
    'Nouvelle marque, semble apprécier.',
    null, null, null,
  ],
  vet: [
    'Tout est normal, en pleine forme.',
    'Léger surpoids, ration à diminuer.',
    'Dents en bon état.',
    'Petit problème cutané, traitement prescrit.',
    'Bilan complet excellent.',
    null,
  ],
};

// ---------- helpers ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const pickWeighted = (arr, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i += 1) {
    r -= weights[i];
    if (r < 0) return arr[i];
  }
  return arr[arr.length - 1];
};

const isoDate = (d) => d.toISOString();
const dateOnly = (d) => d.toISOString().split('T')[0];

const daysFromNow = (days, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

let token = null;

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const detail = body && body.error ? body.error.message : text;
    throw new Error(`API ${options.method || 'GET'} ${path} → ${res.status}: ${detail}`);
  }
  return body;
}

async function ensureSeedUser() {
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: SEED_USER.email, password: SEED_USER.password }),
    });
    token = res.data.token;
    console.log(`✓ Logged in as ${SEED_USER.email}`);
  } catch {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(SEED_USER),
    });
    token = res.data.token;
    console.log(`✓ Registered new user ${SEED_USER.email}`);
  }
}

async function wipeExisting() {
  const res = await api('/api/dogs');
  const dogs = res.data || [];
  if (dogs.length === 0) {
    console.log('  (no existing dogs to wipe)');
    return;
  }
  console.log(`  wiping ${dogs.length} existing dogs…`);
  for (const dog of dogs) {
    await api(`/api/dogs/${dog.id}`, { method: 'DELETE' });
  }
}

async function uploadPhoto(dogId, filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const blob = new Blob([buffer], { type: mime });
  const fd = new FormData();
  fd.append('photo', blob, path.basename(filePath));
  await api(`/api/dogs/${dogId}/photo`, { method: 'POST', body: fd });
}

// ---------- event generators ----------

function generateEventsForDog(dogIndex) {
  const events = [];

  // 1) Vaccine — every dog gets at least one. Distribute next_due_date:
  //    20% overdue, 30% upcoming (≤30d), 50% far future.
  const vaccineKind = pickWeighted(['overdue', 'upcoming', 'far'], [20, 30, 50]);
  const vaccineDate = daysFromNow(-rand(120) - 30); // last vaccine 30-150 days ago
  let nextDueDate;
  if (vaccineKind === 'overdue') {
    nextDueDate = dateOnly(daysFromNow(-rand(15) - 1));   // 1-15 days ago
  } else if (vaccineKind === 'upcoming') {
    nextDueDate = dateOnly(daysFromNow(rand(28) + 2));    // 2-30 days
  } else {
    nextDueDate = dateOnly(daysFromNow(rand(240) + 60));  // 60-300 days
  }
  events.push({
    type: 'vaccine',
    title: pick(VACCINE_TITLES),
    description: pick(DESCRIPTIONS.vaccine),
    event_date: isoDate(vaccineDate),
    next_due_date: nextDueDate,
  });

  // For some dogs, add a second past vaccine (no next_due_date — already replaced).
  if (rand(100) < 40) {
    events.push({
      type: 'vaccine',
      title: pick(VACCINE_TITLES),
      description: pick(DESCRIPTIONS.vaccine),
      event_date: isoDate(daysFromNow(-rand(700) - 200)),
    });
  }

  // 2) Past walks (5-15) over the last 90 days — lots of them for history pagination
  const walkCount = 5 + rand(11);
  for (let i = 0; i < walkCount; i += 1) {
    events.push({
      type: 'walk',
      title: pick(WALK_TITLES),
      description: pick(DESCRIPTIONS.walk),
      event_date: isoDate(daysFromNow(-rand(90) - 1, 7 + rand(13))),
    });
  }

  // 3) Past meals (3-8) over the last 30 days
  const mealCount = 3 + rand(6);
  for (let i = 0; i < mealCount; i += 1) {
    events.push({
      type: 'meal',
      title: pick(MEAL_TITLES),
      description: pick(DESCRIPTIONS.meal),
      event_date: isoDate(daysFromNow(-rand(30) - 1, 7 + rand(2) * 5)), // morning or evening
    });
  }

  // 4) Past vet visits (1-3)
  const vetCount = 1 + rand(3);
  for (let i = 0; i < vetCount; i += 1) {
    events.push({
      type: 'vet',
      title: pick(VET_TITLES),
      description: pick(DESCRIPTIONS.vet),
      event_date: isoDate(daysFromNow(-rand(180) - 5, 9 + rand(8))),
    });
  }

  // 5) Current-month events (for calendar dots) — 2-4
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const calCount = 2 + rand(3);
  for (let i = 0; i < calCount; i += 1) {
    const day = 1 + rand(daysInMonth);
    const d = new Date(now.getFullYear(), now.getMonth(), day, 9 + rand(8));
    events.push({
      type: pick(['walk', 'meal', 'vet']),
      title: pick([...WALK_TITLES, ...MEAL_TITLES, ...VET_TITLES]),
      description: null,
      event_date: isoDate(d),
    });
  }

  // 6) Future events (1-3) for the "à venir" count
  const futureCount = 1 + rand(3);
  for (let i = 0; i < futureCount; i += 1) {
    events.push({
      type: pick(['walk', 'vet']),
      title: pick([...WALK_TITLES, ...VET_TITLES]),
      description: null,
      event_date: isoDate(daysFromNow(rand(45) + 1, 10 + rand(6))),
    });
  }

  // 7) Make a couple of dogs especially "history-heavy" (>20 past events) to test pagination
  if (dogIndex < 4) {
    for (let i = 0; i < 25; i += 1) {
      events.push({
        type: pick(['walk', 'meal']),
        title: pick([...WALK_TITLES, ...MEAL_TITLES]),
        description: null,
        event_date: isoDate(daysFromNow(-rand(360) - 100, rand(24))),
      });
    }
  }

  return events;
}

// ---------- main ----------

async function main() {
  console.log(`\n→ Seeding ${API}\n`);

  await ensureSeedUser();
  await wipeExisting();

  const MAX_BYTES = 5 * 1024 * 1024;
  const allFiles = fs
    .readdirSync(SAMPLE_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(SAMPLE_DIR, f));
  const sampleFiles = allFiles.filter((f) => fs.statSync(f).size <= MAX_BYTES);

  if (sampleFiles.length === 0) {
    throw new Error(`No usable images (≤5MB) found in ${SAMPLE_DIR}`);
  }
  const skipped = allFiles.length - sampleFiles.length;
  if (skipped > 0) {
    console.log(`  (${skipped} sample image(s) skipped — exceed 5MB limit)`);
  }

  const totals = { dogs: 0, events: 0, byType: { vaccine: 0, walk: 0, meal: 0, vet: 0 } };

  for (let i = 0; i < 50; i += 1) {
    const name = DOG_NAMES[i % DOG_NAMES.length];
    const breed = BREEDS[i % BREEDS.length];
    const birthYear = 2017 + rand(8); // 2017-2024
    const birthMonth = 1 + rand(12);
    const birthDay = 1 + rand(28);
    const weight = 4 + Math.round(Math.random() * 460) / 10; // 4.0 - 50.0 kg

    const dogPayload = {
      name,
      ...(breed ? { breed } : {}),
      birth_date: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      weight_kg: weight,
    };

    const created = await api('/api/dogs', {
      method: 'POST',
      body: JSON.stringify(dogPayload),
    });
    const dog = created.data;

    // Upload photo for ~90% of dogs (some without to test placeholder)
    if (rand(100) < 90) {
      const file = sampleFiles[i % sampleFiles.length];
      try {
        await uploadPhoto(dog.id, file);
      } catch (err) {
        console.warn(`    photo upload failed for ${dog.name}: ${err.message}`);
      }
    }

    const events = generateEventsForDog(i);
    for (const e of events) {
      await api(`/api/dogs/${dog.id}/events`, {
        method: 'POST',
        body: JSON.stringify(e),
      });
      totals.events += 1;
      totals.byType[e.type] = (totals.byType[e.type] || 0) + 1;
    }
    totals.dogs += 1;

    console.log(
      `  [${String(i + 1).padStart(2, '0')}/50] ${dog.name.padEnd(10)} ` +
      `(${(breed || 'sans race').padEnd(28)}) — ${events.length} événements`
    );

    // Light throttling so we don't slam the DB
    if (i % 10 === 9) await sleep(50);
  }

  console.log('\n──────────────────────────────────────');
  console.log(`✓ ${totals.dogs} chiens créés`);
  console.log(`✓ ${totals.events} événements au total`);
  console.log(`    vaccins:      ${totals.byType.vaccine}`);
  console.log(`    balades:      ${totals.byType.walk}`);
  console.log(`    repas:        ${totals.byType.meal}`);
  console.log(`    vétérinaire:  ${totals.byType.vet}`);
  console.log('──────────────────────────────────────');
  console.log(`\nUser: ${SEED_USER.email} / ${SEED_USER.password}\n`);
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});
