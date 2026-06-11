(function() {
  const API_BASE = 'https://roof-widget.vercel.app';
  const LICENSE_KEY = 'DMP2024';
  let currentStep = 0;
  let answers = { surface: 80 };
  let quoteResult = null;

  // Nombre total d'étapes (questions uniquement, pas délai ni résultat)
  const TOTAL_QUESTIONS = 12; // 12 questions avant le délai

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
    { value: 'urgent', label: 'Urgent', icon: '🚨' },
    { value: 'moins_3', label: 'Moins de 3 mois', icon: '📅' },
    { value: 'moins_6', label: 'Moins de 6 mois', icon: '📆' },
    { value: 'plus_6', label: 'Plus de 6 mois', icon: '🗓️' },
    { value: 'compare', label: 'Je compare', icon: '🔍' }
  ];

  function init() {
    render();
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

    // Logique des étapes:
    // currentStep 0 à 11 = questions (12 questions)
    // currentStep 12 = écran délai
    // currentStep 13 = résultat
    // currentStep 14 = succès

    if (currentStep < TOTAL_QUESTIONS) {
      renderQuestion(container);
    } else if (currentStep === TOTAL_QUESTIONS) {
      renderDelay(container);
    } else if (currentStep === TOTAL_QUESTIONS + 1 && quoteResult) {
      renderResult(container);
    } else if (currentStep === TOTAL_QUESTIONS + 2) {
      renderSuccess(container);
    }
  }

  function renderQuestion(container) {
    const q = questions[currentStep];
    // Progression basée sur les questions uniquement (pas délai)
    const progress = ((currentStep + 1) / TOTAL_QUESTIONS) * 100;
    
    let html = `
      <div class="widget-progress"><div class="widget-progress-fill" style="width: ${progress}%;"></div></div>
      <div class="widget-step-counter">${currentStep + 1} / ${TOTAL_QUESTIONS}</div>
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
    let html = `
      <div class="widget-progress"><div class="widget-progress-fill" style="width: 100%;"></div></div>
      <div class="widget-step-counter">${TOTAL_QUESTIONS + 1} / ${TOTAL_QUESTIONS + 1}</div>
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
          
          <div style="margin-top: 32px; text-align: left;">
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
    
    // Passer à l'étape suivante
    if (currentStep < TOTAL_QUESTIONS - 1) {
      currentStep++;
      render();
    } else {
      // Dernière question, aller à l'écran délai
      currentStep = TOTAL_QUESTIONS;
      render();
    }
  };

  window.prevStep = () => {
    if (currentStep === TOTAL_QUESTIONS) {
      // Revenir à la dernière question
      currentStep = TOTAL_QUESTIONS - 1;
      render();
    } else if (currentStep === TOTAL_QUESTIONS + 1) {
      // Revenir à l'écran délai
      currentStep = TOTAL_QUESTIONS;
      render();
    } else if (currentStep > 0) {
      currentStep--;
      render();
    }
  };

  window.calculateQuote = async () => {
    const required = ['projectType', 'buildingType', 'surface', 'material', 'age', 'state', 'sides', 'pente', 'accessibility', 'depose', 'postalCode'];
    const missing = required.filter(r => !answers[r]);
    
    if (missing.length > 0) {
      alert('Veuillez répondre à toutes les questions');
      return;
    }
    
    const container = document.getElementById('widget-content');
    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">⏳ Calcul en cours...</div>';
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license: LICENSE_KEY, answers })
      });
      
      quoteResult = await response.json();
      currentStep = TOTAL_QUESTIONS + 1;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license: LICENSE_KEY,
          leadData: { name, phone, email, postalCode: answers.postalCode, projectData: answers },
          quoteData: quoteResult
        })
      });
      
      currentStep = TOTAL_QUESTIONS + 2;
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
