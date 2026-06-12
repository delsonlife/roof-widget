import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license } = req.query;
  
  // Récupérer le domaine depuis l'Origin header (SÉCURISÉ)
  const origin = req.headers.origin || req.headers.referer || '';
  let domain = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!license) {
    return res.status(400).json({ error: 'License key required' });
  }

  // Si aucun domaine trouvé, bloquer
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
    
    // Vérification stricte du domaine
    const allowedDomains = licenseData.domain.split(',').map(d => d.trim());
    const isDomainAllowed = allowedDomains.some(allowed => {
      // Correspondance exacte
      if (domain === allowed) return true;
      // Sous-domaine (ex: www.monsite.fr pour monsite.fr)
      if (domain.endsWith(`.${allowed}`)) return true;
      // Localhost pour les tests
      if (allowed === 'localhost' && (domain === 'localhost' || domain.startsWith('localhost:'))) return true;
      return false;
    });
    
    if (!isDomainAllowed) {
      console.log(`❌ Domaine bloqué: ${domain} | Licence: ${license} | Autorisés: ${allowedDomains.join(', ')}`);
      return res.status(403).json({ 
        error: 'Domain not authorized for this license',
        yourDomain: domain,
        allowedDomains: allowedDomains
      });
    }
    
    console.log(`✅ Domaine autorisé: ${domain} | Licence: ${license}`);
    
    const { branding, services, pricing, regionalMultipliers } = licenseData;
    
    return res.status(200).json({
      valid: true,
      branding,
      services,
      pricing,
      regionalMultipliers,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
