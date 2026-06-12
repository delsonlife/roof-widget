import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Headers CORS - uniquement les domaines nécessaires
  const allowedOrigins = [
    'https://devis-couvreur1.vercel.app',
    'https://roof-widget.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin');
  
  // Requête preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license } = req.query;
  
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  let domain = requestOrigin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!license) {
    return res.status(400).json({ error: 'License key required' });
  }

  if (!domain) {
    return res.status(400).json({ error: 'Unable to determine domain' });
  }

  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const licenseData = licensesData[license];
    
    if (!licenseData) {
      return res.status(401).json({ error: 'Invalid license key' });
    }
    
    if (!licenseData.active) {
      return res.status(403).json({ error: 'License is inactive' });
    }
    
    const allowedDomains = licenseData.allowedOrigins || [licenseData.domain];
    const isDomainAllowed = allowedDomains.some(allowed => {
      const allowedClean = allowed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return domain === allowedClean;
    });
    
    if (!isDomainAllowed) {
      console.log(`❌ Domaine bloqué: ${domain}`);
      return res.status(403).json({ 
        error: 'Domain not authorized',
        yourDomain: domain,
        allowedDomains: allowedDomains
      });
    }
    
    console.log(`✅ Domaine autorisé: ${domain}`);
    
    return res.status(200).json({
      valid: true,
      branding: licenseData.branding || {
        companyName: 'Couverture Paris Pro',
        primaryColor: '#ff6b00'
      },
      services: licenseData.services || {
        renovation: true,
        repair: true,
        cleaning: true,
        insulation: true
      },
      pricing: licenseData.pricing,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
