import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, leadData, quoteData } = req.body;
  
  if (!license || !leadData || !quoteData) {
    return res.status(400).json({ error: 'License, lead data and quote data required' });
  }
  
  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const licenseData = licensesData[license];
    
    if (!licenseData || !licenseData.active) {
      return res.status(401).json({ error: 'Invalid or inactive license' });
    }
    
    const lead = {
      id: generateLeadId(),
      license,
      company: licenseData.branding.companyName,
      timestamp: new Date().toISOString(),
      lead: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        postalCode: leadData.postalCode
      },
      project: leadData.projectData,
      quote: quoteData
    };
    
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
    let leads = [];
    
    if (fs.existsSync(leadsPath)) {
      leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    }
    
    leads.push(lead);
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
    
    await sendEmailNotification(lead, licenseData);
    
    return res.status(200).json({ 
      success: true, 
      leadId: lead.id,
      message: 'Lead captured successfully'
    });
    
  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ error: 'Failed to capture lead' });
  }
}

function generateLeadId() {
  return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function sendEmailNotification(lead, licenseData) {
  const emailContent = `
    Nouveau lead de devis toiture
    
    Client: ${lead.lead.name}
    Email: ${lead.lead.email}
    Téléphone: ${lead.lead.phone}
    Code postal: ${lead.lead.postalCode}
    
    Détails du projet:
    Type: ${lead.project.projectType}
    Matériau: ${lead.project.material}
    Surface: ${lead.project.surface} m²
    Pans: ${lead.project.numberOfSides}
    
    Estimation: ${lead.quote.lowEstimate}€ - ${lead.quote.highEstimate}€
    Délai: ${lead.quote.daysEstimate.min} - ${lead.quote.daysEstimate.max} jours
    
    Date: ${lead.timestamp}
  `;
  
  console.log('Email notification would be sent:', emailContent);
  
  return true;
}
