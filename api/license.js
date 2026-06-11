import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license, domain } = req.query;

  if (!license || !domain) {
    return res.status(400).json({ error: 'License and domain required' });
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
    
    const domainPattern = licenseData.domainPattern || licenseData.domain;
    const domainRegex = new RegExp('^' + domainPattern.replace(/\*/g, '.*') + '$');
    
    if (!domainRegex.test(domain) && domain !== licenseData.domain) {
      return res.status(403).json({ error: 'Domain not authorized for this license' });
    }
    
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
