(function() {
  let currentStep = 0;
  let userResponses = {};
  let quoteResult = null;
  
  // Configuration
  const LICENSE_KEY = 'DMP2024';
  const API_BASE = window.location.origin;
  
  const steps = [
    { id: 'projectType', title: 'Type de projet', type: 'options' },
    { id: 'material', title: 'Matériau', type: 'options' },
    { id: 'surface', title: 'Surface du toit', type: 'slider' },
    { id: 'sides', title: 'Nombre de pans', type: 'options' },
    { id: 'accessibility', title: 'Accessibilité', type: 'options' },
    { id: 'options', title: 'Options', type: 'multiselect' },
    { id: 'postalCode', title: 'Code postal', type: 'input' }
  ];
  
  const projectTypes = [
    { value: 'renovation', label: 'Réfection complète', icon: '🏠', desc: 'Toiture entière à refaire' },
    { value: 'repair', label: 'Réparation', icon: '🔧', desc: 'Réparation localisée' },
    { value: 'cleaning', label: 'Démoussage', icon: '🧹', desc: 'Nettoyage et traitement' },
    { value: 'insulation', label: 'Isolation', icon: '🔥', desc: 'Isolation thermique' }
  ];
  
  const materials = [
    { value: 'tuile', label: 'Tuile', icon: '🏺' },
    { value: 'ardoise', label: 'Ardoise', icon: '🪨' },
    { value: 'zinc', label: 'Zinc', icon: '⚙️' },
    { value: 'bac_acier', label: 'Bac acier', icon: '🔩' }
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
    { value: 'velux', label: 'Velux', icon: '🪟' },
    { value: 'gouttiere', label: 'Gouttières', icon: '💧' },
    { value: 'isolation', label: 'Isolation', icon: '🔥' },
    { value: 'depose', label: 'Dépose toiture', icon: '🗑️' },
    { value: 'charpente', label: 'Traitement charpente', icon: '🪵' }
  ];
  
  function render() {
    let container = document.getElementById('roof-widget-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget-container';
      container.style.cssText = 'position: fixed; bottom: 100px; right: 20px; width: 420px; max-width: calc(100vw - 40px); z-index: 10000;';
      document.body.appendChild(container);
    }
    
    container.innerHTML = `
      <div style="background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden;">
        <div style="height: 4px; background: linear-gradient(90deg, #ff6b00, #ff8533); width: ${((currentStep + 1) / steps.length) * 100}%;"></div>
        <div id="widget-content" style="padding: 24px; max-height: 70vh; overflow-y: auto;"></div>
      </div>
    `;
    
    renderStep();
  }
  
  function renderStep() {
    const content = document.getElementById('widget-content');
    if (!content) return;
    
    const step = steps[currentStep];
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">${step.title}</h2>
        <button onclick="document.getElementById('roof-widget-container').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
      </div>
      <p style="color: #666; margin-bottom: 24px;">Étape ${currentStep + 1} / ${steps.length}</p>
    `;
    
    if (step.type === 'options') {
      let options = [];
      if (step.id === 'projectType') options = projectTypes;
      if (step.id === 'material') options = materials;
      if (step.id === 'sides') options = sidesOptions;
      if (step.id === 'accessibility') options = accessibilityOptions;
      
      html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
      options.forEach(opt => {
        const isSelected = userResponses[step.id] === opt.value;
        html += `
          <div onclick="window.selectOption('${step.id}', '${opt.value}')" style="padding: 16px; border: 2px solid ${isSelected ? '#ff6b00' : '#e5e7eb'}; border-radius: 12px; cursor: pointer; background: ${isSelected ? '#fff7ed' : 'white'}; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${opt.icon}</span>
            <div><div style="font-weight: 600;">${opt.label}</div>${opt.desc ? `<div style="font-size: 12px; color: #666;">${opt.desc}</div>` : ''}</div>
          </div>
        `;
      });
      html += '</div>';
    }
    
    if (step.type === 'slider') {
      const surface = userResponses.surface || 50;
      html += `
        <div>
          <input type="range" id="surface-slider" min="20" max="300" value="${surface}" step="5" style="width: 100%; margin: 20px 0; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px;">
          <div style="text-align: center; font-size: 28px; font-weight: 700; color: #ff6b00;"><span id="surface-value">${surface}</span> m²</div>
        </div>
      `;
    }
    
    if (step.type === 'multiselect') {
      const selected = userResponses.options || {};
      html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
      additionalOptions.forEach(opt => {
        const isSelected = selected[opt.value];
        html += `
          <div onclick="window.toggleOption('${opt.value}')" style="padding: 16px; border: 2px solid ${isSelected ? '#ff6b00' : '#e5e7eb'}; border-radius: 12px; cursor: pointer; background: ${isSelected ? '#fff7ed' : 'white'}; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${opt.icon}</span>
            <div><div style="font-weight: 600;">${opt.label}</div></div>
          </div>
        `;
      });
      html += '</div>';
    }
    
    if (step.type === 'input') {
      html += `
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Code postal</label>
          <input type="text" id="postal-input" style="width: 100%; padding: 14px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px;" placeholder="75001" value="${userResponses.postalCode || ''}" maxlength="5">
        </div>
      `;
    }
    
    html += `
      <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 32px;">
        ${currentStep > 0 ? '<button onclick="window.prevStep()" style="padding: 12px 20px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer; font-weight: 500;">Précédent</button>' : '<div></div>'}
        <button onclick="window.nextStep()" style="padding: 12px 28px; background: #ff6b00; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 500;">${currentStep === steps.length - 1 ? 'Voir estimation' : 'Suivant'}</button>
      </div>
    `;
    
    content.innerHTML = html;
    
    if (step.type === 'slider') {
      const slider = document.getElementById('surface-slider');
      const display = document.getElementById('surface-value');
      if (slider) {
        slider.addEventListener('input', (e) => {
          display.textContent = e.target.value;
          userResponses.surface = parseInt(e.target.value);
        });
      }
    }
  }
  
  window.selectOption = (stepId, value) => {
    userResponses[stepId] = value;
    renderStep();
  };
  
  window.toggleOption = (value) => {
    if (!userResponses.options) userResponses.options = {};
    userResponses.options[value] = !userResponses.options[value];
    renderStep();
  };
  
  window.nextStep = async () => {
    const step = steps[currentStep];
    
    if (step.id === 'postalCode') {
      const input = document.getElementById('postal-input');
      if (!input || !input.value || input.value.length !== 5) {
        alert('Veuillez entrer un code postal valide (5 chiffres)');
        return;
      }
      userResponses.postalCode = input.value;
    }
    
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      await calculate();
    }
  };
  
  window.prevStep = () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  };
  
  async function calculate() {
    const content = document.getElementById('widget-content');
    content.innerHTML = '<div style="text-align: center; padding: 40px;">⏳ Calcul en cours...</div>';
    
    const surface = userResponses.surface || 50;
    const material = userResponses.material || 'tuile';
    
    const prices = { tuile: 95, ardoise: 145, zinc: 180, bac_acier: 110 };
    const pricePerM2 = prices[material];
    
    let low = pricePerM2 * surface * 0.85;
    let high = pricePerM2 * surface * 1.15;
    
    if (userResponses.postalCode) {
      const code = userResponses.postalCode.substring(0, 2);
      const multipliers = { '75': 1.3, '92': 1.25, '93': 1.2, '94': 1.25 };
      const mult = multipliers[code] || 1.0;
      low *= mult;
      high *= mult;
    }
    
    const days = Math.max(3, Math.floor(surface / 15));
    
    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #fff7ed, #ffedd5); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <div style="color: #666;">Estimation de vos travaux</div>
          <div style="font-size: 32px; font-weight: 700; color: #ff6b00; margin: 12px 0;">${Math.round(low).toLocaleString()}€ - ${Math.round(high).toLocaleString()}€</div>
          <div style="background: white; display: inline-block; padding: 8px 16px; border-radius: 50px; font-size: 14px;">⏱️ Délai: ${days} à ${days+3} jours</div>
        </div>
        
        <div style="text-align: left;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nom complet</label>
            <input type="text" id="lead-name" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px;" placeholder="Jean Dupont">
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Téléphone</label>
            <input type="tel" id="lead-phone" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px;" placeholder="06 12 34 56 78">
          </div>
          <div style="margin-bottom: 24px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
            <input type="email" id="lead-email" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 12px;" placeholder="contact@exemple.fr">
          </div>
          
          <button onclick="window.submitLead()" style="width: 100%; padding: 14px; background: #ff6b00; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">Recevoir mon estimation</button>
          <button onclick="window.prevStep()" style="width: 100%; margin-top: 12px; padding: 12px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer;">Modifier</button>
        </div>
      </div>
    `;
  }
  
  window.submitLead = () => {
    const name = document.getElementById('lead-name')?.value;
    const phone = document.getElementById('lead-phone')?.value;
    const email = document.getElementById('lead-email')?.value;
    
    if (!name || !phone || !email) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    const content = document.getElementById('widget-content');
    content.innerHTML = `
      <div style="text-align: center; padding: 48px 24px;">
        <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
        <h2 style="margin-bottom: 16px;">Merci !</h2>
        <p style="color: #666;">Votre demande a bien été envoyée.<br>Un expert vous contactera rapidement.</p>
        <button onclick="document.getElementById('roof-widget-container').remove()" style="margin-top: 24px; padding: 12px 24px; background: #ff6b00; color: white; border: none; border-radius: 12px; cursor: pointer;">Fermer</button>
      </div>
    `;
  };
  
  // Démarrage
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
