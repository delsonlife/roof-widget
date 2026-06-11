export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { license, leadData, quoteData } = req.body;
    
    console.log('Lead reçu:', { license, name: leadData?.name });
    
    // Simuler l'envoi (à remplacer par email ou webhook plus tard)
    return res.status(200).json({ success: true, message: 'Lead reçu' });
    
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}
