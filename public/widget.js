(function() {
  const API_BASE = 'https://roof-widget.vercel.app';
  const LICENSE_KEY = 'DMP2024';
  let currentStep = 0;
  let answers = { surface: 80 };
  let quoteResult = null;
  let questions = [];

  const TOTAL_STEPS = 13;

  const delayOptions = [
    { value: 'urgent', label: 'Urgent (moins d\'une semaine)', icon: '🚨' },
    { value: 'moins_3', label: 'Moins de 3 mois', icon: '📅' },
    { value: 'moins_6', label: 'Moins de 6 mois', icon: '📆' },
    { value: 'plus_6', label: 'Plus de 6 mois', icon: '🗓️' },
    { value: 'compare', label: 'Je compare simplement', icon: '🔍' }
  ];

  async function loadQuestions() {
    try {
      const response = await fetch(`${API_BASE}/api/config?license=${LICENSE_KEY}`);
      const config = await response.json();
      // Les questions sont chargées depuis l'API
      // Pour la V1, on garde les questions en dur mais sans prix
      initQuestions();
      render();
    } catch (error) {
      console.error('Erreur de chargement:', error);
      initQuestions();
      render();
    }
  }

  function initQuestions() {
    // Questions sans prix ni coefficients (juste l'UI)
    questions = [
      { id: 'projectType', question: 'Quel est votre projet ?', type: 'options', options: [
        { value: 'refection_complete', label: 'Réfection complète', icon: '🏠', desc: 'Toiture entière à refaire' },
        { value: 'reparation', label: 'Réparation', icon: '🔧', desc: 'Réparation localisée' },
        { value: 'demoussage', label: 'Démoussage', icon: '🧹', desc: 'Nettoyage et traitement' },
        { value: 'isolation', label: 'Isolation de toiture', icon: '🔥', desc: 'Isolation thermique' },
        { value: 'recherche_fuite', label: 'Recherche de fuite', icon: '💧', desc: 'Détection et réparation' }
      ] },
      { id: 'buildingType', question: 'Quel type de bâtiment ?', type: 'options', options: [
        { value: 'maison', label: 'Maison individuelle', icon: '🏡' },
        { value: 'garage', label: 'Garage', icon: '🚗' },
        { value: 'dependance', label: 'Dépendance', icon: '🏚️' },
        { value: 'immeuble', label: 'Immeuble', icon: '🏢' },
        { value: 'local_pro', label: 'Local professionnel', icon: '🏭' }
      ] },
      { id: 'surface', question: 'Quelle est la surface approximative ?', type: 'slider', min: 20, max: 500, step: 5, unit: 'm²', default: 80 },
      { id: 'material', question: 'Quel est le matériau de couverture ?', type: 'options', options: [
        { value: 'tuile', label: 'Tuile terre cuite', icon: '🏺' },
        { value: 'ardoise', label: 'Ardoise naturelle', icon: '🪨' },
        { value: 'zinc', label: 'Zinc', icon: '⚙️' },
        { value: 'bac_acier', label: 'Bac acier', icon: '🔩' }
      ] },
      { id: 'age', question: 'Quel âge a votre toiture ?', type: 'options', options: [
        { value: 'moins_10', label: 'Moins de 10 ans', icon: '🆕' },
        { value: '10_20', label: '10 à 20 ans', icon: '📅' },
        { value: '20_30', label: '20 à 30 ans', icon: '📆' },
        { value: 'plus_30', label: 'Plus de 30 ans', icon: '🏚️' },
        { value: 'je_ne_sais_pas', label: 'Je ne sais pas', icon: '❓' }
      ] },
      { id: 'state', question: 'Quel est l\'état général de la toiture ?', type: 'options', options: [
        { value: 'bon', label: 'Bon état', icon: '✅' },
        { value: 'moyen', label: 'État moyen', icon: '⚠️' },
        { value: 'degrade', label: 'Dégradée', icon: '🔧' },
        { value: 'tres_degrade', label: 'Très dégradée', icon: '🚨' }
      ] },
      { id: 'sides', question: 'Combien de pans comporte votre toiture ?', type: 'options', options: [
        { value: '1', label: '1 pan', icon: '📐' },
        { value: '2', label: '2 pans', icon: '📏' },
        { value: '4', label: '4 pans', icon: '🔲' },
        { value: 'plus', label: 'Plus de 4 pans', icon: '🔳' }
      ] },
      { id: 'pente', question: 'Quelle est la pente du toit ?', type: 'options', options: [
        { value: 'faible', label: 'Faible', icon: '📉' },
        { value: 'moyenne', label: 'Moyenne', icon: '➡️' },
        { value: 'forte', label: 'Forte', icon: '📈' },
        { value: 'tres_forte', label: 'Très forte', icon: '⛰️' }
      ] },
      { id: 'accessibility', question: 'Accessibilité du chantier ?', type: 'options', options: [
        { value: 'plain_pied', label: 'Plain-pied', icon: '🏡' },
        { value: '1_etage', label: '1 étage', icon: '🏢' },
        { value: '2_etages', label: '2 étages', icon: '🏗️' },
        { value: '3_etages_plus', label: '3 étages ou plus', icon: '🏛️' }
      ] },
      { id: 'depose', question: 'Faut-il déposer l\'ancienne couverture ?', type: 'options', options: [
        { value: 'oui', label: 'Oui', icon: '🗑️' },
        { value: 'non', label: 'Non', icon: '❌' },
        { value: 'je_ne_sais_pas', label: 'Je ne sais pas', icon: '❓' }
      ] },
      { id: 'options', question: 'Options supplémentaires', type: 'multiselect', options: [
        { value: 'velux', label: 'Velux', icon: '🪟', hasQuantity: true },
        { value: 'gouttiere', label: 'Gouttières', icon: '💧' },
        { value: 'isolation', label: 'Isolation', icon: '🔥' },
        { value: 'charpente', label: 'Traitement charpente', icon: '🪵' },
        { value: 'ecran', label: 'Écran sous toiture', icon: '📋' }
      ] },
      { id: 'postalCode', question: 'Votre code postal', type: 'input', placeholder: '75001' }
    ];
  }

  // ... (le reste du code UI est identique à la version précédente)
  // Les fonctions render, nextStep, prevStep, etc. restent les mêmes

  loadQuestions();
})();
