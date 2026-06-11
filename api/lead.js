import fs from 'fs';
import path from 'path';

const LICENSES = {
  DMP2024: {
    domain: 'd-m-nageur1.vercel.app',
    allowedOrigins: ['https://d-m-nageur1.vercel.app']
  }
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, leadData, quoteData } = req.body;
  
  if (!license) {
    return res.status(401).json({ error: 'License key required' });
  }
  
  const licenseData = LICENSES[license];
  if (!licenseData) {
    return res.status(403).json({ error: 'Invalid license key' });
  }
  
  const origin = req.headers.origin;
  if (!licenseData.allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not authorized' });
  }
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
    let leads = [];
    
    if (fs.existsSync(leadsPath)) {
      leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    }
    
    const lead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      license,
      timestamp: new Date().toISOString(),
      lead: leadData,
      quote: quoteData
    };
    
    leads.push(lead);
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
    
    // Ici vous pouvez ajouter l'envoi d'email (Brevo, Resend, etc.)
    
    return res.status(200).json({ success: true, leadId: lead.id });
    
  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ error: 'Failed to capture lead' });
  }
}
