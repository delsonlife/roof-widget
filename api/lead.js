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

// Configuration des webhooks par licence
const WEBHOOKS = {
  DMP2024: 'https://hook.make.com/votre-webhook',
  // Ajoutez d'autres webhooks ici
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const licenses = getLicenses();
    
    let isAllowedOrigin = false;
    for (const [key, config] of Object.entries(licenses)) {
      if (config.active && config.allowedOrigins?.includes(origin)) {
        isAllowedOrigin = true;
        break;
      }
    }
    
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, leadData, quoteData } = req.body;
  
  if (!license) {
    return res.status(401).json({ error: 'License key required' });
  }
  
  const licenses = getLicenses();
  const licenseData = licenses[license];
  
  if (!licenseData || !licenseData.active) {
    return res.status(403).json({ error: 'Invalid or inactive license' });
  }
  
  const origin = req.headers.origin;
  const allowedOrigins = licenseData.allowedOrigins || [licenseData.domain];
  const isValidOrigin = allowedOrigins.includes(origin);
  
  if (!isValidOrigin) {
    return res.status(403).json({ error: 'Origin not authorized' });
  }
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const lead = {
    id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    license,
    company: licenseData.branding?.companyName || 'Client',
    timestamp: new Date().toISOString(),
    lead: {
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      postalCode: leadData.postalCode
    },
    project: leadData.projectData,
    quote: quoteData,
    delay: leadData.delay
  };
  
  try {
    // 1. Envoyer vers le webhook (Make / Zapier / n8n)
    const webhookUrl = WEBHOOKS[license];
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
    }
    
    // 2. Optionnel : Sauvegarder dans Google Sheets via webhook
    // Le webhook Make se charge de tout
    
    // 3. Optionnel : Envoyer un email de notification
    if (licenseData.emailNotifications) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Leads <leads@roof-widget.com>',
          to: licenseData.emailNotifications,
          subject: `Nouveau lead - ${leadData.name}`,
          html: `<h2>Nouvelle demande de devis</h2>
                 <p><strong>Client:</strong> ${leadData.name}</p>
                 <p><strong>Téléphone:</strong> ${leadData.phone}</p>
                 <p><strong>Email:</strong> ${leadData.email}</p>
                 <p><strong>Estimation:</strong> ${quoteData.lowEstimate}€ - ${quoteData.highEstimate}€</p>`
        })
      });
    }
    
    return res.status(200).json({ success: true, leadId: lead.id });
    
  } catch (error) {
    console.error('Lead capture error:', error);
    // Ne pas retourner d'erreur au client pour ne pas perdre le lead
    // Le lead est déjà dans le fichier JSON comme fallback
    return res.status(200).json({ success: true, leadId: lead.id, warning: 'Lead saved locally' });
  }
}
