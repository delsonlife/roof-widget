// Configuration directe (pour tester)
const LICENSES = {
  DMP2024: {
    active: true,
    allowedOrigins: ['https://d-m-nageur1.vercel.app', 'http://localhost:3000'],
    pricing: {
      materials: { tuile: 120, ardoise: 220, zinc: 200, bac_acier: 90 },
      depose: { oui: 15, non: 0, je_ne_sais_pas: 10 },
      accessibility: { plain_pied: 0, "1_etage": 800, "2_etages": 1800, "3_etages_plus": 3000 },
      options: { velux: 900, gouttiere: 35, isolation: 40, charpente: 25, ecran_sous_toiture: 20 }
    },
    coefficients: {
      project: { refection_complete: 1.0, reparation: 0.4, demoussage: 0.15, isolation: 0.7, recherche_fuite: 0.2 },
      building: { maison: 1.0, garage: 0.8, dependance: 0.75, immeuble: 1.3, local_pro: 1.2 },
      age: { moins_10: 1.0, "10_20": 1.05, "20_30": 1.1, plus_30: 1.2, je_ne_sais_pas: 1.1 },
      state: { bon: 1.0, moyen: 1.1, degrade: 1.25, tres_degrade: 1.45 },
      sides: { "1": 1.0, "2": 1.05, "4": 1.15, plus: 1.3 },
      pente: { faible: 1.0, moyenne: 1.05, forte: 1.15, tres_forte: 1.3 },
      region: { paris_idf: 1.15, grande_metropole: 1.10, province: 1.0, rural: 0.95 }
    }
  }
};

export default async function handler(req, res) {
  // Gérer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gérer preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Tester si l'API répond
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'API fonctionnelle' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { license, answers } = req.body;
    
    console.log('Requête reçue:', { license, answers });
    
    if (!license) {
      return res.status(401).json({ error: 'License key required' });
    }
    
    const licenseData = LICENSES[license];
    if (!licenseData || !licenseData.active) {
      return res.status(403).json({ error: 'Invalid license' });
    }
    
    // Calcul simple
    const materialPrice = licenseData.pricing.materials[answers.material] || 120;
    const total = answers.surface * materialPrice;
    
    const lowEstimate = Math.round(total * 0.9);
    const highEstimate = Math.round(total * 1.1);
    
    return res.status(200).json({
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
      complexity: 'moyenne',
      daysEstimate: { min: 3, max: 6 }
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}
