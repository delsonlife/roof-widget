
import fs from 'fs';
import path from 'path';

// Cache pour éviter de relire le fichier à chaque requête
let licensesCache = null;
let licensesLastLoad = 0;
const CACHE_TTL = 60000; // 60 secondes

function getLicenses() {
  const now = Date.now();
  if (!licensesCache || (now - licensesLastLoad) > CACHE_TTL) {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    licensesCache = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    licensesLastLoad = now;
  }
  return licensesCache;
}

// Générer un token temporaire (optionnel)
function generateToken(license, timestamp) {
  // À implémenter avec un secret partagé
  // return crypto.createHmac('sha256', SECRET).update(`${license}:${timestamp}`).digest('hex');
  return null;
}

export default async function handler(req, res) {
  // 1. Gérer OPTIONS (preflight CORS) CORRECTEMENT
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const licenses = getLicenses();
    
    // Vérifier si l'origine est autorisée pour une licence
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
    res.setHeader('Access-Control-Max-Age', '86400');
    
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, answers, token } = req.body;
  
  // 2. Vérifier la licence
  if (!license) {
    return res.status(401).json({ error: 'License key required' });
  }
  
  const licenses = getLicenses();
  const licenseData = licenses[license];
  
  if (!licenseData || !licenseData.active) {
    return res.status(403).json({ error: 'Invalid or inactive license' });
  }
  
  // 3. Vérifier l'origine (CORS) - La VRAIE vérification
  const origin = req.headers.origin;
  const allowedOrigins = licenseData.allowedOrigins || [licenseData.domain];
  const isValidOrigin = allowedOrigins.includes(origin);
  
  if (!isValidOrigin) {
    return res.status(403).json({ 
      error: 'Origin not authorized for this license',
      origin: origin,
      allowed: allowedOrigins
    });
  }
  
  // 4. Ajouter les headers CORS avec l'origine spécifique
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 5. Vérification optionnelle du token (si implémentée)
  if (licenseData.secret && token) {
    // Vérifier le token
    // const expectedToken = generateToken(license, answers.timestamp);
    // if (token !== expectedToken) {
    //   return res.status(403).json({ error: 'Invalid token' });
    // }
  }
  
  // 6. Calculer le devis
  try {
    const result = calculateQuote(answers, licenseData);
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
  total *= coefficients.region[answers.region] || 1.0;
  
  // Accessibilité
  total += pricing.accessibility[answers.accessibility] || 0;
  
  // Dépose
  total += (pricing.depose[answers.depose] || 0) * answers.surface;
  
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
  
  // Complexité (avec seuils calibrés)
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
  let score = 0;
  
  // État (0-3)
  const stateScore = { bon: 0, moyen: 0.5, degrade: 1, tres_degrade: 1.5 };
  score += stateScore[answers.state] || 0;
  
  // Pans (0-1.5)
  const sidesScore = { 1: 0, 2: 0.3, 4: 0.6, plus: 1 };
  score += sidesScore[answers.sides] || 0;
  
  // Pente (0-1)
  const penteScore = { faible: 0, moyenne: 0.2, forte: 0.5, tres_forte: 0.8 };
  score += penteScore[answers.pente] || 0;
  
  // Accessibilité (0-1)
  const accessScore = { plain_pied: 0, 1_etage: 0.3, 2_etages: 0.6, 3_etages_plus: 0.9 };
  score += accessScore[answers.accessibility] || 0;
  
  // Seuils calibrés
  if (score < 1) return 'faible';
  if (score < 1.8) return 'moyenne';
  return 'elevee';
}

function calculateDays(answers, complexity) {
  const baseDays = Math.ceil(answers.surface / 50);
  let multiplier = 1.0;
  if (complexity === 'moyenne') multiplier = 1.3;
  if (complexity === 'elevee') multiplier = 1.8;
  
  const min = Math.max(1, Math.floor(baseDays * multiplier));
  const max = Math.max(2, Math.ceil(baseDays * multiplier * 1.3));
  
  return { min, max };
}
