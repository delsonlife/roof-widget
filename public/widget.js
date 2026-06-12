(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const LICENSE_KEY = urlParams.get('license') || 'DMP2024';
  
  const API_BASE = 'https://toiture-one.vercel.app';
  let currentStep = 0;
  let answers = { surface: 80 };
  let quoteResult = null;
  let licenseValid = false;
  let branding = {};

  const TOTAL_STEPS = 13;

  const questions = [
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

  const delayOptions = [
    { value: 'urgent', label: 'Urgent (moins d\'une semaine)', icon: '🚨' },
    { value: 'moins_3', label: 'Moins de 3 mois', icon: '📅' },
    { value: 'moins_6', label: 'Moins de 6 mois', icon: '📆' },
    { value: 'plus_6', label: 'Plus de 6 mois', icon: '🗓️' },
    { value: 'compare', label: 'Je compare simplement', icon: '🔍' }
  ];

  const labels = {
    projectType: { refection_complete: 'Réfection complète', reparation: 'Réparation', demoussage: 'Démoussage', isolation: 'Isolation', recherche_fuite: 'Recherche de fuite' },
    buildingType: { maison: 'Maison individuelle', garage: 'Garage', dependance: 'Dépendance', immeuble: 'Immeuble', local_pro: 'Local professionnel' },
    material: { tuile: 'Tuile', ardoise: 'Ardoise', zinc: 'Zinc', bac_acier: 'Bac acier' },
    age: { moins_10: 'Moins de 10 ans', '10_20': '10 à 20 ans', '20_30': '20 à 30 ans', plus_30: 'Plus de 30 ans', je_ne_sais_pas: 'Je ne sais pas' },
    state: { bon: 'Bon état', moyen: 'État moyen', degrade: 'Dégradée', tres_degrade: 'Très dégradée' },
    sides: { '1': '1 pan', '2': '2 pans', '4': '4 pans', plus: 'Plus de 4 pans' },
    pente: { faible: 'Faible', moyenne: 'Moyenne', forte: 'Forte', tres_forte: 'Très forte' },
    accessibility: { plain_pied: 'Plain-pied', '1_etage': '1 étage', '2_etages': '2 étages', '3_etages_plus': '3 étages ou plus' },
    depose: { oui: 'Oui', non: 'Non', je_ne_sais_pas: 'Je ne sais pas' },
    delay: { urgent: 'Urgent', moins_3: 'Moins de 3 mois', moins_6: 'Moins de 6 mois', plus_6: 'Plus de 6 mois', compare: 'Je compare' }
  };

  async function init() {
    const isValid = await checkLicense();
    if (!isValid) {
      showError('Licence invalide ou domaine non autorisé');
      return;
    }
    // Afficher directement le widget sans bouton flottant
    render();
  }

  async function checkLicense() {
    try {
      const response = await fetch(`${API_BASE}/api/license?license=${LICENSE_KEY}`, {
        headers: { 'Origin': window.location.origin }
      });
      const data = await response.json();
      if (data.valid) {
        licenseValid = true;
        branding = data.branding || {};
        if (branding.primaryColor) {
          document.documentElement.style.setProperty('--rw-primary', branding.primaryColor);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur vérification licence:', error);
      return false;
    }
  }

  function showError(message) {
    let container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      document.body.appendChild(container);
    }
    container.innerHTML = `
      <div style="background: #fee2e2; color: #dc2626; padding: 20px; border-radius: 12px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
        <h3>Accès non autorisé</h3>
        <p>${message}</p>
      </div>
    `;
  }

  function render() {
    let container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      container.className = 'widget-typeform';
      const target = document.getElementById('roof-widget-container') || document.body;
      target.appendChild(container);
    }

    if (currentStep < questions.length) {
      renderQuestion(container);
    } else if (currentStep === questions.length) {
      renderDelay(container);
    } else if (currentStep === questions.length + 1 && quoteResult) {
      renderResult(container);
    } else if (currentStep === questions.length + 2) {
      renderRecap(container);
    } else if (currentStep === questions.length + 3) {
      renderSuccess(container);
    }
  }

  function renderQuestion(container) {
    const q = questions[currentStep];
    const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
    
    let html = `
      <div class="widget-progress"><div class="widget-progress-fill" style="width: ${progress}%;"></div></div>
      <div class="widget-step-counter">${currentStep + 1} / ${TOTAL_STEPS}</div>
      <div class="widget-content">
        <div class="widget-step">
          <h2 class="widget-question">${q.question}</h2>
    `;
    
    if (q.type === 'options') {
      html += '<div class="widget-options">';
      q.options.forEach(opt => {
        const isSelected = answers[q.id] === opt.value;
        html += `
          <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.selectOption('${q.id}', '${opt.value}')">
            <div class="widget-option-icon">${opt.icon}</div>
            <div class="widget-option-text">
              <div class="widget-option-title">${opt.label}</div>
              ${opt.desc ? `<div class="widget-option-desc">${opt.desc}</div>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    
    if (q.type === 'slider') {
      const val = answers.surface || 80;
      html += `
        <div class="widget-slider-container">
          <div class="widget-slider-label"><span>Surface</span><span id="slider-value-display">${val} m²</span></div>
          <input type="range" id="surface-slider" min="20" max="500" step="5" value="${val}">
          <div class="widget-slider-value"><span id="slider-value">${val}</span> <span class="widget-slider-unit">m²</span></div>
        </div>
      `;
    }
    
    if (q.type === 'multiselect') {
      const selected = answers[q.id] || {};
      html += '<div class="widget-checkbox-group">';
      q.options.forEach(opt => {
        const isSelected = selected[opt.value];
        html += `
          <div class="widget-checkbox ${isSelected ? 'selected' : ''}" onclick="window.toggleOption('${q.id}', '${opt.value}')">
            <div class="widget-checkbox-icon">${opt.icon}</div>
            <div class="widget-checkbox-label">${opt.label}</div>
            <input type="checkbox" ${isSelected ? 'checked' : ''}>
          </div>
        `;
        if (opt.hasQuantity && selected[opt.value]) {
          const qty = selected.veluxCount || 1;
          html += `
            <div class="widget-quantity">
              <button class="widget-quantity-btn" onclick="event.stopPropagation(); window.changeQuantity(-1)">−</button>
              <span class="widget-quantity-value">${qty}</span>
              <button class="widget-quantity-btn" onclick="event.stopPropagation(); window.changeQuantity(1)">+</button>
              <span>Velux</span>
            </div>
          `;
        }
      });
      html += '</div>';
    }
    
    if (q.type === 'input') {
      html += `
        <div class="widget-input-group">
          <input type="text" class="widget-input" id="postal-input" placeholder="${q.placeholder}" maxlength="5" value="${answers[q.id] || ''}">
        </div>
      `;
    }
    
    html += `
        </div>
        <div class="widget-navigation">
          <button class="widget-btn widget-btn-prev" onclick="window.prevStep()" ${currentStep === 0 ? 'disabled' : ''}>← Retour</button>
          <button class="widget-btn widget-btn-next" onclick="window.nextStep()">Suivant →</button>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    if (q.type === 'slider') {
      setupSlider();
    }
  }

  function renderDelay(container) {
    const progress = 100;
    
    let html = `
      <div class="widget-progress"><div class="widget-progress-fill" style="width: ${progress}%;"></div></div>
      <div class="widget-step-counter">${questions.length + 1} / ${TOTAL_STEPS}</div>
      <div class="widget-content">
        <div class="widget-step">
          <h2 class="widget-question">Quel est votre délai ?</h2>
          <div class="widget-options">
    `;
    
    delayOptions.forEach(opt => {
      const isSelected = answers.delay === opt.value;
      html += `
        <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.selectDelay('${opt.value}')">
          <div class="widget-option-icon">${opt.icon}</div>
          <div class="widget-option-text">
            <div class="widget-option-title">${opt.label}</div>
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
        <div class="widget-navigation">
          <button class="widget-btn widget-btn-prev" onclick="window.prevStep()">← Retour</button>
          <button class="widget-btn widget-btn-next" onclick="window.calculateQuote()">Voir mon estimation →</button>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }

  function renderResult(container) {
    const html = `
      <div class="widget-content">
        <div class="widget-step">
          <h2 class="widget-question">Votre estimation</h2>
          <div class="widget-result-price">
            <div class="widget-result-range">Estimation prévisionnelle</div>
            <div class="widget-result-amount">${quoteResult.lowEstimate.toLocaleString()}€ - ${quoteResult.highEstimate.toLocaleString()}€</div>
          </div>
          <div class="widget-result-days">⏱️ Durée estimée : ${quoteResult.daysEstimate.min} à ${quoteResult.daysEstimate.max} jours</div>
          
          <div class="widget-navigation" style="margin-top: 32px;">
            <button class="widget-btn widget-btn-prev" onclick="window.prevStep()">← Modifier</button>
            <button class="widget-btn widget-btn-next" onclick="window.showRecap()">Continuer →</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  function renderRecap(container) {
    const recapItems = [
      { label: 'Type de projet', value: labels.projectType[answers.projectType] },
      { label: 'Type de bâtiment', value: labels.buildingType[answers.buildingType] },
      { label: 'Surface', value: `${answers.surface} m²` },
      { label: 'Matériau', value: labels.material[answers.material] },
      { label: 'Âge de la toiture', value: labels.age[answers.age] },
      { label: 'État général', value: labels.state[answers.state] },
      { label: 'Nombre de pans', value: labels.sides[answers.sides] },
      { label: 'Pente', value: labels.pente[answers.pente] },
      { label: 'Accessibilité', value: labels.accessibility[answers.accessibility] },
      { label: 'Dépose ancienne', value: labels.depose[answers.depose] },
      { label: 'Délai souhaité', value: labels.delay[answers.delay] },
      { label: 'Code postal', value: answers.postalCode }
    ];
    
    let optionsList = [];
    if (answers.options) {
      if (answers.options.velux) optionsList.push(`Velux (${answers.options.veluxCount || 1}x)`);
      if (answers.options.gouttiere) optionsList.push('Gouttières');
      if (answers.options.isolation) optionsList.push('Isolation');
      if (answers.options.charpente) optionsList.push('Traitement charpente');
      if (answers.options.ecran) optionsList.push('Écran sous toiture');
    }
    if (optionsList.length > 0) {
      recapItems.push({ label: 'Options', value: optionsList.join(', ') });
    }
    
    let recapHtml = '<div style="background: #f8fafc; border-radius: 20px; padding: 24px; margin: 20px 0;">';
    recapHtml += '<h3 style="margin-bottom: 16px; color: #1a1a2e;">📋 Récapitulatif de vos réponses</h3>';
    recapHtml += '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    recapItems.forEach(item => {
      recapHtml += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: #64748b;">${item.label}</span>
          <span style="font-weight: 500; color: #1a1a2e;">${item.value}</span>
        </div>
      `;
    });
    
    recapHtml += '</div></div>';
    
    const html = `
      <div class="widget-content">
        <div class="widget-step">
          <h2 class="widget-question">Vérifiez vos informations</h2>
          <p style="color: #64748b; margin-bottom: 20px;">Confirmez vos réponses avant de recevoir votre estimation détaillée.</p>
          
          ${recapHtml}
          
          <div style="margin-top: 24px; text-align: left;">
            <div class="widget-form-group">
              <label>Nom complet</label>
              <input type="text" id="lead-name" class="widget-input" placeholder="Jean Dupont">
            </div>
            <div class="widget-form-group">
              <label>Téléphone</label>
              <input type="tel" id="lead-phone" class="widget-input" placeholder="06 12 34 56 78">
            </div>
            <div class="widget-form-group">
              <label>Email</label>
              <input type="email" id="lead-email" class="widget-input" placeholder="contact@exemple.fr">
            </div>
          </div>
          
          <div class="widget-navigation">
            <button class="widget-btn widget-btn-prev" onclick="window.prevStep()">← Modifier</button>
            <button class="widget-btn widget-btn-submit" onclick="window.submitLead()">Recevoir mon estimation →</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  function renderSuccess(container) {
    container.innerHTML = `
      <div class="widget-content">
        <div class="widget-step" style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 24px;">✅</div>
          <h2 class="widget-question">Merci !</h2>
          <p style="color: #64748b;">Votre demande a bien été envoyée.<br>Un artisan vous contactera rapidement.</p>
          <button class="widget-btn widget-btn-next" onclick="location.reload()" style="margin-top: 24px;">Nouvelle estimation →</button>
        </div>
      </div>
    `;
  }

  window.showRecap = () => {
    currentStep = questions.length + 2;
    render();
  };

  window.selectOption = (id, value) => {
    answers[id] = value;
    render();
  };

  window.selectDelay = (value) => {
    answers.delay = value;
    render();
  };

  window.toggleOption = (id, value) => {
    if (!answers[id]) answers[id] = {};
    answers[id][value] = !answers[id][value];
    render();
  };

  window.changeQuantity = (delta) => {
    if (!answers.options) answers.options = {};
    const current = answers.options.veluxCount || 1;
    answers.options.veluxCount = Math.max(1, current + delta);
    render();
  };

  window.nextStep = () => {
    const q = questions[currentStep];
    
    if (q.type === 'input') {
      const input = document.getElementById('postal-input');
      if (input && input.value) {
        if (input.value.length !== 5) {
          alert('Code postal invalide (5 chiffres)');
          return;
        }
        answers[q.id] = input.value;
      }
    }
    
    if (q.type === 'options' && !answers[q.id]) {
      alert('Veuillez sélectionner une option');
      return;
    }
    
    if (currentStep < questions.length - 1) {
      currentStep++;
      render();
    } else {
      currentStep = questions.length;
      render();
    }
  };

  window.prevStep = () => {
    if (currentStep === questions.length) {
      currentStep = questions.length - 1;
      render();
    } else if (currentStep === questions.length + 1) {
      currentStep = questions.length;
      render();
    } else if (currentStep === questions.length + 2) {
      currentStep = questions.length + 1;
      render();
    } else if (currentStep > 0) {
      currentStep--;
      render();
    }
  };

  window.calculateQuote = async () => {
    if (!answers.delay) {
      alert('Veuillez sélectionner un délai');
      return;
    }
    
    const required = ['projectType', 'buildingType', 'surface', 'material', 'age', 'state', 'sides', 'pente', 'accessibility', 'depose', 'postalCode'];
    const missing = required.filter(r => !answers[r]);
    
    if (missing.length > 0) {
      alert('Veuillez répondre à toutes les questions');
      return;
    }
    
    const container = document.getElementById('roof-widget');
    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">⏳ Calcul en cours...</div>';
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({ 
          license: LICENSE_KEY, 
          answers,
          domain: window.location.hostname 
        })
      });
      
      if (!response.ok) throw new Error('Erreur licence');
      
      quoteResult = await response.json();
      currentStep = questions.length + 1;
      render();
    } catch (error) {
      alert('Erreur lors du calcul: ' + error.message);
    }
  };

  window.submitLead = async () => {
    const name = document.getElementById('lead-name')?.value;
    const phone = document.getElementById('lead-phone')?.value;
    const email = document.getElementById('lead-email')?.value;
    
    if (!name || !phone || !email) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          license: LICENSE_KEY,
          domain: window.location.hostname,
          leadData: { name, phone, email, postalCode: answers.postalCode, projectData: answers },
          quoteData: quoteResult
        })
      });
      
      currentStep = questions.length + 3;
      render();
    } catch (error) {
      alert('Erreur lors de l\'envoi');
    }
  };

  function setupSlider() {
    const slider = document.getElementById('surface-slider');
    if (slider) {
      const update = () => {
        const val = parseInt(slider.value);
        document.getElementById('slider-value').textContent = val;
        document.getElementById('slider-value-display').textContent = val + ' m²';
        answers.surface = val;
      };
      slider.addEventListener('input', update);
      update();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
