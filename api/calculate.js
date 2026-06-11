import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { license, answers } = req.body;
  
  if (!license || !answers) {
    return res.status(400).json({ error: 'License and answers required' });
  }
  
  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const licenseData = licensesData[license];
    
    if (!licenseData || !licenseData.active) {
      return res.status(401).json({ error: 'Invalid or inactive license' });
    }
    
    const result = calculateQuote(answers, licenseData);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ error: 'Calculation failed' });
  }
}

function calculateQuote(answers, licenseData) {
  const { pricing, coefficients } = licenseData;
  
  // 1. Prix de base : surface × prix matériau
  const materialPrice = pricing.materials[answers.material] || 120;
  let total = answers.surface * materialPrice;
  
  // 2. Appliquer les coefficients multiplicatifs
  total *= coefficients.project[answers.projectType] || 1.0;
  total *= coefficients.building[answers.buildingType] || 1.0;
  total *= coefficients.age[answers.age] || 1.0;
  total *= coefficients.state[answers.state] || 1.0;
  total *= coefficients.sides[answers.sides] || 1.0;
  total *= coefficients.pente[answers.pente] || 1.0;
  
  // 3. Coefficient régional
  const regionCoeff = coefficients.region[answers.region] || 1.0;
  total *= regionCoeff;
  
  // 4. Ajouter les suppléments fixes
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
  
  // 5. Fourchette finale (±10%)
  const lowEstimate = Math.round(total * 0.9);
  const highEstimate = Math.round(total * 1.1);
  const average = Math.round((lowEstimate + highEstimate) / 2);
  
  // 6. Complexité du chantier
  const complexityScore = calculateComplexity(answers, coefficients);
  const complexity = getComplexityLevel(complexityScore, licenseData.complexityRules);
  
  // 7. Durée estimée
  const days = calculateDays(answers, complexity, licenseData.daysEstimate);
  
  return {
    lowEstimate,
    highEstimate,
    averageEstimate: average,
    complexity,
    complexityScore,
    daysEstimate: days,
    breakdown: {
      basePrice: Math.round(answers.surface * materialPrice),
      materialMultiplier: materialPrice,
      coefficients: {
        project: coefficients.project[answers.projectType],
        building: coefficients.building[answers.buildingType],
        age: coefficients.age[answers.age],
        state: coefficients.state[answers.state],
        sides: coefficients.sides[answers.sides],
        pente: coefficients.pente[answers.pente],
        region: regionCoeff
      },
      extras: {
        accessibility: accessCost,
        depose: Math.round(deposeCost * answers.surface),
        options: Math.round(optionsCost)
      }
    }
  };
}

function calculateComplexity(answers, coefficients) {
  let score = 1.0;
  
  // Plus l'état est dégradé, plus c'est complexe
  const stateComplexity = {
    'bon': 0.5,
    'moyen': 1.0,
    'degrade': 1.5,
    'tres_degrade': 2.0
  };
  score += stateComplexity[answers.state] || 0;
  
  // Plus il y a de pans, plus c'est complexe
  const sidesComplexity = {
    '1': 0,
    '2': 0.3,
    '4': 0.6,
    'plus': 1.0
  };
  score += sidesComplexity[answers.sides] || 0;
  
  // Pente forte = complexité
  const penteComplexity = {
    'faible': 0,
    'moyenne': 0.2,
    'forte': 0.5,
    'tres_forte': 1.0
  };
  score += penteComplexity[answers.pente] || 0;
  
  // Accessibilité
  const accessComplexity = {
    'plain_pied': 0,
    '1_etage': 0.3,
    '2_etages': 0.6,
    '3_etages_plus': 1.0
  };
  score += accessComplexity[answers.accessibility] || 0;
  
  return Math.min(score, 3.0);
}

function getComplexityLevel(score, rules) {
  if (score < 1.2) return 'faible';
  if (score < 2.0) return 'moyenne';
  return 'elevee';
}

function calculateDays(answers, complexity, daysEstimate) {
  const surface = answers.surface;
  const baseDays = Math.ceil(surface / 50);
  
  let multiplier = 1.0;
  if (complexity === 'moyenne') multiplier = 1.5;
  if (complexity === 'elevee') multiplier = 2.0;
  
  const min = Math.max(1, Math.floor(baseDays * multiplier * 0.8));
  const max = Math.max(2, Math.ceil(baseDays * multiplier * 1.2));
  
  return { min, max };
}
