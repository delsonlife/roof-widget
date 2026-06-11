(function() {
  let config = null;
  let currentStep = 0;
  let userResponses = {};
  let quoteResult = null;
  
  // LICENCE FORCÉE POUR COUVERTURE PARIS PRO
  const FORCED_LICENSE = 'DMP2024';
  
  const steps = [
    { id: 'projectType', title: 'Type de projet', type: 'options' },
    { id: 'material', title: 'Matériau', type: 'options' },
    { id: 'surface', title: 'Surface du toit', type: 'slider' },
    { id: 'sides', title: 'Nombre de pans', type: 'options' },
    { id: 'accessibility', title: 'Accessibilité', type: 'options' },
    { id: 'options', title: 'Options supplémentaires', type: 'multiselect' },
    { id: 'postalCode', title: 'Code postal', type: 'input' }
  ];
  
  const projectTypes = [
    { value: 'renovation', label: 'Réfection complète', icon: '🏠', description: 'Toiture entière à refaire' },
    { value: 'repair', label: 'Réparation', icon: '🔧', description: 'Réparation localisée' },
    { value: 'cleaning', label: 'Démoussage', icon: '🧹', description: 'Nettoyage et traitement' },
    { value: 'insulation', label: 'Isolation toiture', icon: '🔥', description: 'Isolation thermique' }
  ];
  
  const materials = [
    { value: 'tuile', label: 'Tuile', icon: '🏺', price: 95 },
    { value: 'ardoise', label: 'Ardoise', icon: '🪨', price: 145 },
    { value: 'zinc', label: 'Zinc', icon: '⚙️', price: 180 },
    { value: 'bac_acier', label: 'Bac acier', icon: '🔩', price: 110 }
  ];
  
  const sidesOptions = [
    { value: '1', label: '1 pan', icon: '📐' },
    { value: '2', label: '2 pans', icon: '📏' },
    { value: '4', label: '4 pans', icon: '🔲' },
    { value: 'plus', label: 'Plus de 4', icon: '🔳' }
  ];
  
  const accessibilityOptions = [
    { value: 'plain_pied', label: 'Plain-pied', icon: '🏡' },
    { value: '1_etage', label: '1 étage', icon: '🏢' },
    { value: '2_etages', label: '2 étages', icon: '🏗️' },
    { value: 'plus', label: 'Plus', icon: '🏛️' }
  ];
  
  const additionalOptions = [
    { value: 'velux', label: 'Velux', icon: '🪟', price: 1200 },
    { value: 'gouttiere', label: 'Gouttières', icon: '💧', price: 35 },
    { value: 'isolation', label: 'Isolation', icon: '🔥', price: 45 },
    { value: 'depose', label: 'Dépose ancienne toiture', icon: '🗑️', price: 25 },
    { value: 'charpente', label: 'Traitement charpente', icon: '🪵', price: 65 }
  ];
  
  async function initWidget() {
    try {
      // Utiliser la licence forcée ou celle de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const licenseKey = FORCED_LICENSE || urlParams.get('license') || getLicenseFromScript();
      
      if (!licenseKey) {
        console.error('No license key provided');
        return;
      }
      
      console.log('Licence utilisée:', licenseKey);
      
      const domain = window.location.hostname;
      const response = await fetch(`/api/license?license=${licenseKey}&domain=${domain}`);
      const data = await response.json();
      
      if (!data.valid) {
        console.error('Invalid license');
        return;
      }
      
      config = data;
      applyBranding(config.branding);
      renderWidget();
      
    } catch (error) {
      console.error('Widget initialization failed:', error);
    }
  }
  
  function getLicenseFromScript() {
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
      const src = script.src;
      if (src && src.includes('widget.js')) {
        const urlParams = new URLSearchParams(src.split('?')[1]);
        return urlParams.get('license');
      }
    }
    return null;
  }
  
  function applyBranding(branding) {
    document.documentElement.style.setProperty('--widget-primary', branding.primaryColor);
    document.documentElement.style.setProperty('--widget-secondary', branding.secondaryColor);
    
    if (branding.logo) {
      const logo = branding.logo;
    }
  }
  
  function renderWidget() {
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.id = 'roof-widget';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'widget-progress';
    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    
    const content = document.createElement('div');
    content.className = 'widget-content';
    content.id = 'widget-content';
    
    container.appendChild(progressBar);
    container.appendChild(content);
    
    const existingWidget = document.getElementById('roof-widget');
    if (existingWidget) {
      existingWidget.replaceWith(container);
    } else {
      document.body.appendChild(container);
    }
    
    renderCurrentStep();
  }
  
  async function renderCurrentStep() {
    const content = document.getElementById('widget-content');
    if (!content) return;
    
    const step = steps[currentStep];
    
    let html = `
      <div class="widget-step">
        <h2 class="widget-title">${step.title}</h2>
        <p class="widget-subtitle">Étape ${currentStep + 1} sur ${steps.length}</p>
    `;
    
    switch (step.type) {
      case 'options':
        html += renderOptionsStep(step.id);
        break;
      case 'slider':
        html += renderSliderStep();
        break;
      case 'multiselect':
        html += renderMultiselectStep();
        break;
      case 'input':
        html += renderInputStep();
        break;
    }
    
    html += `
        <div class="widget-actions">
          ${currentStep > 0 ? '<button class="widget-button widget-button-secondary" onclick="window.widgetPrevStep()">Précédent</button>' : ''}
          <button class="widget-button widget-button-primary" onclick="window.widgetNextStep()">${currentStep === steps.length - 1 ? 'Voir mon estimation' : 'Suivant'}</button>
        </div>
      </div>
    `;
    
    content.innerHTML = html;
    
    if (step.type === 'slider') {
      setupSlider();
    }
  }
  
  function renderOptionsStep(stepId) {
    let options = [];
    switch (stepId) {
      case 'projectType':
        options = projectTypes;
        break;
      case 'material':
        options = materials;
        break;
      case 'sides':
        options = sidesOptions;
        break;
      case 'accessibility':
        options = accessibilityOptions;
        break;
    }
    
    let html = '<div class="widget-options">';
    options.forEach(option => {
      const isSelected = userResponses[stepId] === option.value;
      html += `
        <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.widgetSelectOption('${stepId}', '${option.value}')">
          <div class="widget-option-icon">${option.icon}</div>
          <div class="widget-option-text">
            <div class="widget-option-title">${option.label}</div>
            ${option.description ? `<div class="widget-option-description">${option.description}</div>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }
  
  function renderSliderStep() {
    const currentSurface = userResponses.surface || 50;
    return `
      <div class="widget-slider">
        <input type="range" id="surface-slider" min="20" max="300" value="${currentSurface}" step="5">
        <div class="widget-slider-value">
          <span id="surface-value">${currentSurface}</span> m²
        </div>
      </div>
    `;
  }
  
  function renderMultiselectStep() {
    const selectedOptions = userResponses.options || {};
    let html = '<div class="widget-options">';
    additionalOptions.forEach(option => {
      const isSelected = selectedOptions[option.value];
      html += `
        <div class="widget-option ${isSelected ? 'selected' : ''}" onclick="window.widgetToggleOption('${option.value}')">
          <div class="widget-option-icon">${option.icon}</div>
          <div class="widget-option-text">
            <div class="widget-option-title">${option.label}</div>
            <div class="widget-option-description">À partir de ${option.price}€</div>
          </div>
        </div>
      `;
    });
    
    html += `
      <div class="widget-option" onclick="window.widgetShowVeluxCount()">
        <div class="widget-option-icon">🪟</div>
        <div class="widget-option-text">
          <div class="widget-option-title">Nombre de Velux</div>
          <div class="widget-option-description">${selectedOptions.veluxCount || 1} Velux</div>
        </div>
      </div>
    `;
    
    html += '</div>';
    return html;
  }
  
  function renderInputStep() {
    return `
      <div class="widget-form-group">
        <label for="postal-code">Code postal</label>
        <input type="text" id="postal-code" class="widget-input" placeholder="75001" value="${userResponses.postalCode || ''}" maxlength="5">
      </div>
    `;
  }
  
  function setupSlider() {
    const slider = document.getElementById('surface-slider');
    const valueDisplay = document.getElementById('surface-value');
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        userResponses.surface = parseInt(e.target.value);
      });
    }
  }
  
  function selectOption(stepId, value) {
    userResponses[stepId] = value;
    renderCurrentStep();
  }
  
  function toggleOption(optionValue) {
    if (!userResponses.options) userResponses.options = {};
    userResponses.options[optionValue] = !userResponses.options[optionValue];
    renderCurrentStep();
  }
  
  function showVeluxCount() {
    const count = prompt('Nombre de Velux à installer:', userResponses.options?.veluxCount || 1);
    if (count && !isNaN(count)) {
      if (!userResponses.options) userResponses.options = {};
      userResponses.options.velux = true;
      userResponses.options.veluxCount = parseInt(count);
      renderCurrentStep();
    }
  }
  
  async function nextStep() {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'projectType':
        if (!userResponses.projectType) {
          alert('Veuillez sélectionner un type de projet');
          return;
        }
        break;
      case 'material':
        if (!userResponses.material) {
          alert('Veuillez sélectionner un matériau');
          return;
        }
        break;
      case 'surface':
        if (!userResponses.surface) {
          userResponses.surface = 50;
        }
        break;
      case 'postalCode':
        const postalCode = document.getElementById('postal-code')?.value;
        if (!postalCode || postalCode.length !== 5) {
          alert('Veuillez entrer un code postal valide');
          return;
        }
        userResponses.postalCode = postalCode;
        break;
    }
    
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderCurrentStep();
    } else {
      await calculateQuote();
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderCurrentStep();
    }
  }
  
  async function calculateQuote() {
    const licenseKey = FORCED_LICENSE || getLicenseFromScript();
    
    const projectData = {
      projectType: userResponses.projectType,
      material: userResponses.material,
      surface: userResponses.surface,
      numberOfSides: userResponses.sides,
      accessibility: userResponses.accessibility,
      options: userResponses.options || {},
      postalCode: userResponses.postalCode
    };
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license: licenseKey, projectData })
      });
      
      quoteResult = await response.json();
      renderQuoteResult();
      
    } catch (error) {
      console.error('Calculation failed:', error);
      alert('Erreur lors du calcul. Veuillez réessayer.');
    }
  }
  
  function renderQuoteResult() {
    const content = document.getElementById('widget-content');
    
    let optionsHtml = '';
    if (userResponses.options) {
      const selectedOptions = Object.keys(userResponses.options).filter(key => userResponses.options[key] === true && key !== 'veluxCount');
      if (selectedOptions.length > 0) {
        optionsHtml = `<div style="font-size: 14px; margin-top: 12px;">
          Options: ${selectedOptions.join(', ')}
          ${userResponses.options.veluxCount ? ` (${userResponses.options.veluxCount} Velux)` : ''}
        </div>`;
      }
    }
    
    content.innerHTML = `
      <div class="widget-step">
        <h2 class="widget-title">Votre estimation</h2>
        <div class="widget-quote">
          <div class="widget-quote-range">Estimation de</div>
          <div class="widget-quote-amount">${quoteResult.lowEstimate.toLocaleString()}€ - ${quoteResult.highEstimate.toLocaleString()}€</div>
          <div class="widget-quote-days">
            ⏱️ Délai estimé: ${quoteResult.daysEstimate.min} à ${quoteResult.daysEstimate.max} jours
          </div>
          ${optionsHtml}
        </div>
        
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
          <input type="email" id="lead-email" class="widget-input" placeholder="jean@exemple.fr">
        </div>
        
        <div class="widget-actions">
          <button class="widget-button widget-button-secondary" onclick="window.widgetPrevStep()">Modifier</button>
          <button class="widget-button widget-button-primary" onclick="window.widgetSubmitLead()">Recevoir mon estimation détaillée</button>
        </div>
      </div>
    `;
  }
  
  async function submitLead() {
    const name = document.getElementById('lead-name')?.value;
    const phone = document.getElementById('lead-phone')?.value;
    const email = document.getElementById('lead-email')?.value;
    
    if (!name || !phone || !email) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Email invalide');
      return;
    }
    
    const phoneRegex = /^[0-9+\s]{10,}$/;
    if (!phoneRegex.test(phone)) {
      alert('Téléphone invalide');
      return;
    }
    
    const licenseKey = FORCED_LICENSE || getLicenseFromScript();
    
    const leadData = {
      name,
      phone,
      email,
      postalCode: userResponses.postalCode,
      projectData: {
        projectType: userResponses.projectType,
        material: userResponses.material,
        surface: userResponses.surface,
        numberOfSides: userResponses.sides,
        accessibility: userResponses.accessibility,
        options: userResponses.options
      }
    };
    
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license: licenseKey, leadData, quoteData: quoteResult })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const content = document.getElementById('widget-content');
        content.innerHTML = `
          <div class="widget-step" style="text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h2 class="widget-title">Merci !</h2>
            <p style="margin: 20px 0; color: #6b7280;">
              Votre demande d'estimation a bien été envoyée.<br>
              Un expert vous contactera dans les plus brefs délais.
            </p>
            <button class="widget-button widget-button-primary" onclick="window.location.reload()">Nouvelle estimation</button>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Lead submission failed:', error);
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    }
  }
  
  window.widgetSelectOption = selectOption;
  window.widgetToggleOption = toggleOption;
  window.widgetShowVeluxCount = showVeluxCount;
  window.widgetNextStep = nextStep;
  window.widgetPrevStep = prevStep;
  window.widgetSubmitLead = submitLead;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
