import fs from 'fs';
import path from 'path';

// Domaines autorisés (vérifiés par licence)
const LICENSES = {
  DMP2024: {
    domain: 'd-m-nageur1.vercel.app',
    allowedOrigins: [
      'https://d-m-nageur1.vercel.app',
      'https://www.d-m-nageur1.vercel.app'
    ]
  }
  // Ajoutez d'autres licences ici
};

export default async function handler(req, res) {
  // 1. Gérer la requête OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    // Les headers CORS seront ajoutés après vérification de l'origine
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, answers } = req.body;
  
  // 2. Vérifier que la licence est fournie
  if (!license) {
    return res.status(401).json({ error: 'License key required' });
  }
  
  // 3. Vérifier que la licence existe
  const licenseData = LICENSES[license];
  if (!licenseData) {
    return res.status(403).json({ error: 'Invalid license key' });
  }
  
  // 4. Vérifier l'origine de la requête
  const origin = req.headers.origin;
  const isValidOrigin = licenseData.allowedOrigins.includes(origin);
  
  if (!isValidOrigin) {
    return res.status(403).json({ 
      error: 'Origin not authorized for this license',
      origin: origin,
      expected: licenseData.allowedOrigins
    });
  }
  
  // 5. Ajouter le header CORS avec l'origine spécifique (pas *)
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    // 6. Charger la configuration du client depuis licenses.json
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const clientConfig = licensesData[license];
    if (!clientConfig || !clientConfig.active) {
      return res.status(403).json({ error: 'License inactive or not found' });
    }
    
    // 7. Vérifier que le domaine correspond aussi (double sécurité)
    const hostname = req.headers.host?.split(':')[0];
    if (!clientConfig.domainPattern.includes(hostname) && hostname !== clientConfig.domain) {
      // Log pour debug
      console.warn(`Domain mismatch: ${hostname} vs ${clientConfig.domain}`);
    }
    
    // 8. Calculer le devis
    const result = calculateQuote(answers, clientConfig);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ error: 'Calculation failed' });
  }
}

function calculateQuote(answers, config) {
  const { pricing, coefficients } = config;
  
  // Prix de base : surface × prix matériau
  const materialPrice = pricing.materials[answers.material] || 120;
  let total = answers.surface * materialPrice;
  
  // Appliquer les coefficients
  total *= coefficients.project[answers.projectType] || 1.0;
  total *= coefficients.building[answers.buildingType] || 1.0;
  total *= coefficients.age[answers.age] || 1.0;
  total *= coefficients.state[answers.state] || 1.0;
  total *= coefficients.sides[answers.sides] || 1.0;
  total *= coefficients.pente[answers.pente] || 1.0;
  
  // Coefficient régional
  const regionCoeff = coefficients.region[answers.region] || 1.0;
  total *= regionCoeff;
  
  // Accessibilité
  const accessCost = pricing.accessibility[answers.accessibility] || 0;
  total += accessCost;
  
  // Dépose
  const deposeCost = pricing.depose[answers.depose] || 0;
  total += deposeCost * answers.surface;
  
  // Options
  let optionsCost = 0;
  if (answers.options) {
    if (answers.options.velux) optionsCost += pricing.options.velux * (answers.options.veluxCount || 1);
    if (answers.options.gouttiere) optionsCost += pricing.options.gouttiere * (answers.surface / 10);
    if (answers.options.isolation) optionsCost += pricing.options.isolation * answers.surface;
    if (answers.options.charpente) optionsCost += pricing.options.charpente * answers.surface;
    if (answers.options.ecran_sous_toiture) optionsCost += pricing.options.ecran_sous_toiture * answers.surface;
  }
  total += optionsCost;
  
  // Fourchette finale (±10%)
  const lowEstimate = Math.round(total * 0.9);
  const highEstimate = Math.round(total * 1.1);
  
  // Complexité
  const complexity = calculateComplexity(answers);
  
  // Durée
  const days = calculateDays(answers, complexity);
  
  return {
    lowEstimate,
    highEstimate,
    averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
    complexity,
    daysEstimate: days
  };
}

function calculateComplexity(answers) {
  let score = 1.0;
  
  const stateComplexity = { bon: 0.5, moyen: 1.0, degrade: 1.5, tres_degrade: 2.0 };
  score += stateComplexity[answers.state] || 0;
  
  const sidesComplexity = { 1: 0, 2: 0.3, 4: 0.6, plus: 1.0 };
  score += sidesComplexity[answers.sides] || 0;
  
  const penteComplexity = { faible: 0, moyenne: 0.2, forte: 0.5, tres_forte: 1.0 };
  score += penteComplexity[answers.pente] || 0;
  
  const accessComplexity = { plain_pied: 0, 1_etage: 0.3, 2_etages: 0.6, 3_etages_plus: 1.0 };
  score += accessComplexity[answers.accessibility] || 0;
  
  if (score < 1.2) return 'faible';
  if (score < 2.0) return 'moyenne';
  return 'elevee';
}

function calculateDays(answers, complexity) {
  const baseDays = Math.ceil(answers.surface / 50);
  let multiplier = 1.0;
  if (complexity === 'moyenne') multiplier = 1.5;
  if (complexity === 'elevee') multiplier = 2.0;
  
  const min = Math.max(1, Math.floor(baseDays * multiplier * 0.8));
  const max = Math.max(2, Math.ceil(baseDays * multiplier * 1.2));
  
  return { min, max };
}
