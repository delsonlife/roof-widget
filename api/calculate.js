import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, projectData } = req.body;
  
  if (!license || !projectData) {
    return res.status(400).json({ error: 'License and project data required' });
  }
  
  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const licenseData = licensesData[license];
    
    if (!licenseData || !licenseData.active) {
      return res.status(401).json({ error: 'Invalid or inactive license' });
    }
    
    const result = calculateQuote(projectData, licenseData);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ error: 'Calculation failed' });
  }
}

function calculateQuote(projectData, licenseData) {
  const { 
    projectType, 
    material, 
    surface, 
    numberOfSides, 
    accessibility,
    options,
    postalCode 
  } = projectData;
  
  const { pricing, regionalMultipliers } = licenseData;
  
  let basePrice = pricing.baseRate || 500;
  
  const materialPrice = pricing[material] || 100;
  basePrice += materialPrice * surface;
  
  const sidesMultiplier = getSidesMultiplier(numberOfSides);
  basePrice *= sidesMultiplier;
  
  const accessibilityMultiplier = getAccessibilityMultiplier(accessibility);
  basePrice *= accessibilityMultiplier;
  
  let optionsCost = 0;
  if (options) {
    if (options.velux) optionsCost += pricing.velux * (options.veluxCount || 1);
    if (options.gouttiere) optionsCost += pricing.gouttiere * surface / 10;
    if (options.isolation) optionsCost += pricing.isolation * surface;
    if (options.depose) optionsCost += pricing.depose * surface;
    if (options.charpente) optionsCost += pricing.charpente * surface / 5;
  }
  
  let regionalMultiplier = 1.0;
  if (postalCode && regionalMultipliers) {
    const prefix = postalCode.substring(0, 2);
    regionalMultiplier = regionalMultipliers[prefix] || 1.0;
  }
  
  const projectMultiplier = getProjectMultiplier(projectType);
  
  let finalPrice = (basePrice + optionsCost) * regionalMultiplier * projectMultiplier;
  
  const lowEstimate = Math.round(finalPrice * 0.9);
  const highEstimate = Math.round(finalPrice * 1.1);
  
  const daysEstimate = calculateDaysEstimate(surface, projectType, options);
  
  return {
    lowEstimate,
    highEstimate,
    averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
    daysEstimate,
    currency: '€',
    breakdown: {
      basePrice: Math.round(basePrice),
      materials: Math.round(materialPrice * surface),
      options: Math.round(optionsCost),
      regionalAdjustment: Math.round(finalPrice - basePrice - optionsCost)
    }
  };
}

function getSidesMultiplier(sides) {
  const multipliers = { '1': 1.0, '2': 1.2, '4': 1.5, 'plus': 1.8 };
  return multipliers[sides] || 1.2;
}

function getAccessibilityMultiplier(accessibility) {
  const multipliers = { 'plain_pied': 1.0, '1_etage': 1.15, '2_etages': 1.3, 'plus': 1.5 };
  return multipliers[accessibility] || 1.0;
}

function getProjectMultiplier(projectType) {
  const multipliers = { 'renovation': 1.0, 'repair': 0.6, 'cleaning': 0.3, 'insulation': 0.8 };
  return multipliers[projectType] || 1.0;
}

function calculateDaysEstimate(surface, projectType, options) {
  let days = surface / 20;
  
  if (projectType === 'renovation') days *= 1.5;
  if (projectType === 'repair') days *= 0.8;
  if (projectType === 'cleaning') days *= 0.5;
  
  if (options && options.velux) days += 0.5;
  if (options && options.isolation) days += 1;
  if (options && options.charpente) days += 1.5;
  
  return {
    min: Math.max(2, Math.floor(days)),
    max: Math.max(3, Math.ceil(days * 1.3))
  };
}
