(function() {
  // Configuration
  const FORCED_LICENSE = 'DMP2024';
  const API_BASE = 'https://roof-widget.vercel.app';
  let currentStep = 0;
  let answers = {
    surface: 80  // Valeur par défaut
  };
  let quoteResult = null;

  // Définition des questions
  const questions = [
    {
      id: 'projectType',
      question: 'Quel est votre projet ?',
      type: 'options',
      options: [
        { value: 'refection_complete', label: 'Réfection complète', icon: '🏠', desc: 'Toiture entière à refaire' },
        { value: 'reparation', label: 'Réparation', icon: '🔧', desc: 'Réparation localisée' },
        { value: 'demoussage', label: 'Démoussage', icon: '🧹', desc: 'Nettoyage et traitement' },
        { value: 'isolation', label: 'Isolation de toiture', icon: '🔥', desc: 'Isolation thermique' },
        { value: 'recherche_fuite', label: 'Recherche de fuite', icon: '💧', desc: 'Détection et réparation' }
      ]
    },
    {
      id: 'buildingType',
      question: 'Quel type de bâtiment ?',
      type: 'options',
      options: [
        { value: 'maison', label: 'Maison individuelle', icon: '🏡' },
        { value: 'garage', label: 'Garage', icon: '🚗' },
        { value: 'dependance', label: 'Dépendance', icon: '🏚️' },
        { value: 'immeuble', label: 'Immeuble', icon: '🏢' },
        { value: 'local_pro', label: 'Local professionnel', icon: '🏭' }
      ]
    },
    {
      id: 'surface',
      question: 'Quelle est la surface approximative ?',
      type: 'slider',
      min: 20,
      max: 500,
      step: 5,
      unit: 'm²',
      default: 80
    },
    {
      id: 'material',
      question: 'Quel est le matériau de couverture ?',
      type: 'options',
      options: [
        { value: 'tuile', label: 'Tuile terre cuite', icon: '🏺', price: '120 €/m²' },
        { value: 'ardoise', label: 'Ardoise naturelle', icon: '🪨', price: '220 €/m²' },
        { value: 'zinc', label: 'Zinc', icon: '⚙️', price: '200 €/m²' },
        { value: 'bac_acier', label: 'Bac acier', icon: '🔩', price: '90 €/m²' }
      ]
    },
    {
      id: 'age',
      question: 'Quel âge a votre toiture ?',
      type: 'options',
      options: [
        { value: 'moins_10', label: 'Moins de 10 ans', icon: '🆕' },
        { value: '10_20', label: '10 à 20 ans', icon: '📅' },
        { value: '20_30', label: '20 à 30 ans', icon: '📆' },
        { value: 'plus_30', label: 'Plus de 30 ans', icon: '🏚️' },
        { value: 'je_ne_sais_pas', label: 'Je ne sais pas', icon: '❓' }
      ]
    },
    {
      id: 'state',
      question: 'Quel est l\'état général de la toiture ?',
      type: 'options',
      options: [
        { value: 'bon', label: 'Bon état', icon: '✅', desc: 'Quelques tuiles à remplacer' },
        { value: 'moyen', label: 'État moyen', icon: '⚠️', desc: 'Usure visible' },
        { value: 'degrade', label: 'Dégradée', icon: '🔧', desc: 'Fuite possible' },
        { value: 'tres_degrade', label: 'Très dégradée', icon: '🚨', desc: 'Urgence' }
      ]
    },
    {
      id: 'sides',
      question: 'Combien de pans comporte votre toiture ?',
      type: 'options',
      options: [
        { value: '1', label: '1 pan', icon: '📐' },
        { value: '2', label: '2 pans', icon: '📏' },
        { value: '4', label: '4 pans', icon: '🔲' },
        { value: 'plus', label: 'Plus de 4 pans', icon: '🔳' }
      ]
    },
    {
      id: 'pente',
      question: 'Quelle est la pente du toit ?',
      type: 'options',
      options: [
        { value: 'faible', label: 'Faible (moins de 15°)', icon: '📉' },
        { value: 'moyenne', label: 'Moyenne (15°-30°)', icon: '➡️' },
        { value: 'forte', label: 'Forte (30°-45°)', icon: '📈' },
        { value: 'tres_forte', label: 'Très forte (plus de 45°)', icon: '⛰️' }
      ]
    },
    {
      id: 'accessibility',
      question: 'Accessibilité du chantier ?',
      type: 'options',
      options: [
        { value: 'plain_pied', label: 'Plain-pied', icon: '🏡', supplement: '0€' },
        { value: '1_etage', label: '1 étage', icon: '🏢', supplement: '+800€' },
        { value: '2_etages', label: '2 étages', icon: '🏗️', supplement: '+1800€' },
        { value: '3_etages_plus', label: '3 étages ou plus', icon: '🏛️', supplement: '+3000€' }
      ]
    },
    {
      id: 'depose',
      question: 'Faut-il déposer l\'ancienne couverture ?',
      type: 'options',
      options: [
        { value: 'oui', label: 'Oui', icon: '🗑️', supplement: '+15€/m²' },
        { value: 'non', label: 'Non', icon: '❌', supplement: '0€' },
        { value: 'je_ne_sais_pas', label: 'Je ne sais pas', icon: '❓', supplement: '+10€/m²' }
      ]
    },
    {
      id: 'options',
      question: 'Sélectionnez les options souhaitées',
      type: 'multiselect',
      options: [
        { value: 'velux', label: 'Velux', icon: '🪟', price: '+900€/unité', hasQuantity: true },
        { value: 'gouttiere', label: 'Gouttières', icon: '💧', price: '+35€/ml' },
        { value: 'isolation', label: 'Isolation toiture', icon: '🔥', price: '+40€/m²' },
        { value: 'charpente', label: 'Traitement charpente', icon: '🪵', price: '+25€/m²' },
        { value: 'ecran_sous_toiture', label: 'Écran sous toiture', icon: '📋', price: '+20€/m²' }
      ]
    },
    {
      id: 'postalCode',
      question: 'Votre code postal',
      type: 'input',
      inputType: 'text',
      placeholder: '75001',
      pattern: '[0-9]{5}',
      maxLength: 5
    }
  ];

  const delayOptions = [
    { value: 'urgent', label: 'Urgent (moins d\'une semaine)', icon: '🚨' },
    { value: 'moins_3', label: 'Moins de 3 mois', icon: '📅' },
    { value: 'moins_6', label: 'Moins de 6 mois', icon: '📆' },
    { value: 'plus_6', label: 'Plus de 6 mois', icon: '🗓️' },
    { value: 'compare', label: 'Je compare simplement', icon: '🔍' }
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

    const step = questions[currentStep];
    const progress = ((currentStep + 1) / (questions.length + 1)) * 100;

    let html = `
      <div class="widget-progress">
        <div class="widget-progress-fill" style="width: ${progress}%;"></div>
      </div>
      <div class="widget-step-counter">${currentStep + 1} / ${questions.length + 1}</div>
      <div class="widget-content">
        <div class="widget-step">
    `;

    if (currentStep < questions.length) {
      html += `<h2 class="widget-question">${step.question}</h2>`;

      switch (step.type) {
        case 'options':
          html += renderOptions(step);
          break;
        case 'slider':
          html += renderSlider(step);
          break;
        case 'multiselect':
          html += renderMultiselect(step);
          break;
        case 'input':
          html += renderInput(step);
          break;
      }

      html += `
        </div>
        <div class="widget-navigation">
          <button class="widget-btn widget-btn-prev" onclick="window.widgetPrev()" ${currentStep === 0 ? 'disabled style="opacity:0.5"' : ''}>← Retour</button>
          <button class="widget-btn widget-btn-next" onclick="window.widgetNext()">Suivant →</button>
        </div>
      `;
    } else if (currentStep === questions.length) {
      html += `<h2 class="widget-question">Quel est votre délai ?</h2>`;
      html += `<div class="widget-options">`;
      delayOptions.forEach(opt => {
        const isSelected = answers.delay === opt.value;
        html += `
          <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.widgetSelectDelay('${opt.value}')">
            <div class="widget-option-icon">${opt.icon}</div>
            <div class="widget-option-text">
              <div class="widget-option-title">${opt.label}</div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      html += `
        </div>
        <div class="widget-navigation">
          <button class="widget-btn widget-btn-prev" onclick="window.widgetPrev()">← Retour</button>
          <button class="widget-btn widget-btn-next" onclick="window.widgetCalculate()">Voir mon estimation →</button>
        </div>
      `;
    } else if (currentStep === questions.length + 1 && quoteResult) {
      html += renderResult();
    } else if (currentStep === questions.length + 2) {
      html += renderSuccess();
    }

    html += `</div></div>`;
    container.innerHTML = html;
    
    // Ré-attacher les événements du slider après le rendu
    if (currentStep < questions.length && questions[currentStep].type === 'slider') {
      setTimeout(setupSlider, 50);
    }
  }

  function renderOptions(step) {
    let html = '<div class="widget-options">';
    step.options.forEach(opt => {
      const isSelected = answers[step.id] === opt.value;
      html += `
        <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.widgetSelectOption('${step.id}', '${opt.value}')">
          <div class="widget-option-icon">${opt.icon}</div>
          <div class="widget-option-text">
            <div class="widget-option-title">${opt.label}</div>
            ${opt.desc ? `<div class="widget-option-desc">${opt.desc}</div>` : ''}
            ${opt.supplement ? `<div class="widget-option-desc" style="color: #ff6b00;">${opt.supplement}</div>` : ''}
            ${opt.price ? `<div class="widget-option-desc" style="color: #ff6b00;">${opt.price}</div>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderSlider(step) {
    const value = answers.surface || step.default;
    return `
      <div class="widget-slider-container">
        <div class="widget-slider-label">
          <span>Surface</span>
          <span id="slider-value-display">${value} ${step.unit}</span>
        </div>
        <input type="range" id="surface-slider" min="${step.min}" max="${step.max}" step="${step.step}" value="${value}">
        <div class="widget-slider-value">
          <span id="slider-value">${value}</span>
          <span class="widget-slider-unit">${step.unit}</span>
        </div>
      </div>
    `;
  }

  function renderMultiselect(step) {
    const selected = answers[step.id] || {};
    let html = '<div class="widget-checkbox-group">';
    step.options.forEach(opt => {
      const isSelected = selected[opt.value];
      html += `
        <div class="widget-checkbox ${isSelected ? 'selected' : ''}" onclick="window.widgetToggleOption('${step.id}', '${opt.value}')">
          <div class="widget-checkbox-icon">${opt.icon}</div>
          <div class="widget-checkbox-label">${opt.label}</div>
          <div class="widget-checkbox-price">${opt.price}</div>
          <input type="checkbox" ${isSelected ? 'checked' : ''}>
        </div>
      `;
      if (opt.hasQuantity && selected[opt.value]) {
        const qty = selected.veluxCount || 1;
        html += `
          <div class="widget-quantity">
            <button class="widget-quantity-btn" onclick="event.stopPropagation(); window.widgetChangeQuantity(-1)">−</button>
            <span class="widget-quantity-value" id="velux-count">${qty}</span>
            <button class="widget-quantity-btn" onclick="event.stopPropagation(); window.widgetChangeQuantity(1)">+</button>
            <span style="font-size: 13px; color: #64748b;">Velux</span>
          </div>
        `;
      }
    });
    html += '</div>';
    return html;
  }

  function renderInput(step) {
    const value = answers[step.id] || '';
    return `
      <div class="widget-input-group">
        <input type="${step.inputType}" class="widget-input" id="postal-input" placeholder="${step.placeholder}" maxlength="${step.maxLength}" value="${value}">
      </div>
    `;
  }

  function renderResult() {
    const complexityLabels = { faible: 'Faible', moyenne: 'Moyenne', elevee: 'Élevée' };
    const complexityClass = `complexity-${quoteResult.complexity}`;

    return `
      <div class="widget-result">
        <h2 class="widget-question">Votre estimation</h2>
        <div class="widget-result-price">
          <div class="widget-result-range">Estimation prévisionnelle</div>
          <div class="widget-result-amount">${quoteResult.lowEstimate.toLocaleString()}€ - ${quoteResult.highEstimate.toLocaleString()}€</div>
        </div>
        <div>
          <span class="widget-result-badge ${complexityClass}">Complexité : ${complexityLabels[quoteResult.complexity]}</span>
        </div>
        <div class="widget-result-days">
          ⏱️ Durée estimée : ${quoteResult.daysEstimate.min} à ${quoteResult.daysEstimate.max} jours
        </div>

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
          <button class="widget-btn widget-btn-prev" onclick="window.widgetPrev()">← Modifier</button>
          <button class="widget-btn widget-btn-submit" onclick="window.widgetSubmit()">Recevoir mon estimation détaillée →</button>
        </div>
      </div>
    `;
  }

  function renderSuccess() {
    return `
      <div class="widget-success">
        <div class="widget-success-icon">✅</div>
        <h3 class="widget-success-title">Merci !</h3>
        <p class="widget-success-message">
          Votre demande d'estimation a bien été envoyée.<br>
          Un artisan vous contactera dans les plus brefs délais.
        </p>
        <button class="widget-btn widget-btn-next" onclick="window.location.reload()" style="margin-top: 24px;">Nouvelle estimation →</button>
      </div>
    `;
  }

  window.widgetSelectOption = (id, value) => {
    answers[id] = value;
    render();
  };

  window.widgetSelectDelay = (value) => {
    answers.delay = value;
    render();
  };

  window.widgetToggleOption = (id, value) => {
    if (!answers[id]) answers[id] = {};
    answers[id][value] = !answers[id][value];
    render();
  };

  window.widgetChangeQuantity = (delta) => {
    if (!answers.options) answers.options = {};
    const current = answers.options.veluxCount || 1;
    const newVal = Math.max(1, current + delta);
    answers.options.veluxCount = newVal;
    render();
  };

  window.widgetNext = () => {
    const step = questions[currentStep];
    
    if (step) {
      // Validation selon le type
      if (step.type === 'input') {
        const input = document.getElementById('postal-input');
        if (!input || !input.value || input.value.length !== 5) {
          alert('Veuillez entrer un code postal valide (5 chiffres)');
          return;
        }
        answers[step.id] = input.value;
      }
      
      if (step.type === 'options' && !answers[step.id]) {
        alert('Veuillez sélectionner une option');
        return;
      }
    }
    
    currentStep++;
    render();
  };

  window.widgetPrev = () => {
    if (currentStep > 0) {
      currentStep--;
      render();
    }
  };

  window.widgetCalculate = async () => {
    // Vérifier que toutes les réponses essentielles sont présentes
    const required = ['projectType', 'buildingType', 'surface', 'material', 'age', 'state', 'sides', 'pente', 'accessibility', 'depose', 'postalCode'];
    const missing = required.filter(r => !answers[r]);
    
    if (missing.length > 0) {
      console.error('Réponses manquantes:', missing);
      alert('Veuillez répondre à toutes les questions avant de voir l\'estimation');
      return;
    }

    // Déterminer la région
    const postalCode = answers.postalCode || '';
    let region = 'province';
    if (postalCode && (postalCode.startsWith('75') || postalCode.startsWith('92') || postalCode.startsWith('93') || postalCode.startsWith('94') || postalCode.startsWith('95'))) {
      region = 'paris_idf';
    } else if (postalCode && (postalCode.startsWith('13') || postalCode.startsWith('33') || postalCode.startsWith('59') || postalCode.startsWith('69') || postalCode.startsWith('31'))) {
      region = 'grande_metropole';
    } else if (postalCode && postalCode.match(/^[0-9]/)) {
      region = 'rural';
    }
    answers.region = region;

    // Afficher un indicateur de chargement
    const container = document.getElementById('widget-content');
    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 40px;">⏳ Calcul en cours...</div>';
    }

    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license: FORCED_LICENSE, answers })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      quoteResult = await response.json();
      currentStep = questions.length + 1;
      render();
    } catch (error) {
      console.error('Calculation failed:', error);
      alert('Erreur lors du calcul. Veuillez réessayer.\n\nDétail technique: ' + error.message);
    }
  };

  window.widgetSubmit = async () => {
    const name = document.getElementById('lead-name')?.value;
    const phone = document.getElementById('lead-phone')?.value;
    const email = document.getElementById('lead-email')?.value;

    if (!name || !phone || !email) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      alert('Email invalide');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license: FORCED_LICENSE,
          leadData: { name, phone, email, postalCode: answers.postalCode, projectData: answers, delay: answers.delay },
          quoteData: quoteResult
        })
      });

      const result = await response.json();
      if (result.success) {
        currentStep = questions.length + 2;
        render();
      } else {
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Lead submission failed:', error);
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    }
  };

  function setupSlider() {
    const slider = document.getElementById('surface-slider');
    const valueDisplay = document.getElementById('slider-value');
    const labelDisplay = document.getElementById('slider-value-display');

    if (slider) {
      // Mettre à jour la valeur initiale
      const update = () => {
        const val = parseInt(slider.value);
        if (valueDisplay) valueDisplay.textContent = val;
        if (labelDisplay) labelDisplay.textContent = val + ' m²';
        answers.surface = val;
      };
      
      slider.addEventListener('input', update);
      update(); // Appel immédiat pour initialiser
    }
  }

  // Démarrage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
