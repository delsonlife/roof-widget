import fs from 'fs';
import path from 'path';

let licensesCache = null;
let licensesLastLoad = 0;
const CACHE_TTL = 60000;

function getLicenses() {
  const now = Date.now();
  if (!licensesCache || (now - licensesLastLoad) > CACHE_TTL) {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    licensesCache = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    licensesLastLoad = now;
  }
  return licensesCache;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { license } = req.query;
  
  if (!license) {
    return res.status(401).json({ error: 'License required' });
  }
  
  const licenses = getLicenses();
  const licenseData = licenses[license];
  
  if (!licenseData || !licenseData.active) {
    return res.status(403).json({ error: 'Invalid license' });
  }
  
  // Ne renvoyer que la configuration nécessaire pour l'UI
  // (pas les prix ni les coefficients)
  return res.status(200).json({
    valid: true,
    branding: licenseData.branding,
    steps: 13
  });
}
