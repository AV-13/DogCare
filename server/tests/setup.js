const fs = require('fs');
const path = require('path');

// Load .env.test only if it exists (CI provides env vars directly).
const envPath = path.join(__dirname, '..', '.env.test');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
