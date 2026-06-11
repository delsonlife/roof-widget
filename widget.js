// Version complète du widget de devis toiture
(function() {
  const LICENSE_KEY = 'DMP2024';
  let currentStep = 0;
  let answers = {};
  let quoteResult = null;
  
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
    { id: 'postalCode', question: 'Votre code postal', type: 'input', placeholder: '75001' }
  ];
  
  function init() {
    let container = document.getElementById('roof-widget-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget-container';
      const target = document.getElementById('roof-widget') || document.body;
      target.appendChild(container);
    }
    render();
  }
  
  function render() {
    const container = document.getElementById('roof-widget-container');
    if (!container) return;
    
    if (currentStep < questions.length) {
      const q = questions[currentStep];
      let html = `
        <div style="background: white; border-radius: 32px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="margin-bottom: 8px; color: #ff6b00; font-weight: 600;">${currentStep + 1} / ${questions.length}</div>
          <div style="height: 4px; background: #e2e8f0; border-radius: 2px; margin-bottom: 32px;">
            <div style="width: ${((currentStep + 1) / questions.length) * 100}%; height: 100%; background: #ff6b00; border-radius: 2px;"></div>
          </div>
          <h2 style="font-size: 28px; font-weight: 600; margin-bottom: 32px; color: #1a1a2e;">${q.question}</h2>
      `;
      
      if (q.type === 'options') {
        html += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
        q.options.forEach(opt => {
          const isSelected = answers[q.id] === opt.value;
          html += `
            <div onclick="window.selectAnswer('${q.id}', '${opt.value}')" style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; border: 2px solid ${isSelected ? '#ff6b00' : '#e2e8f0'}; border-radius: 20px; cursor: pointer; background: ${isSelected ? '#fff7ed' : 'white'}; transition: all 0.2s;">
              <span style="font-size: 28px;">${opt.icon}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600;">${opt.label}</div>
                ${opt.desc ? `<div style="font-size: 13px; color: #64748b;">${opt.desc}</div>` : ''}
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }
      
      if (q.type === 'slider') {
        const val = answers.surface || q.default;
        html += `
          <div>
            <input type="range" id="surface-slider" min="${q.min}" max="${q.max}" step="${q.step}" value="${val}" style="width: 100%; margin: 20px 0; height: 6px; -webkit-appearance: none; background: #e2e8f0; border-radius: 3px;">
            <div style="text-align: center; font-size: 36px; font-weight: 700; color: #ff6b00;"><span id="surface-value">${val}</span> <span style="font-size: 16px;">${q.unit}</span></div>
          </div>
        `;
      }
      
      if (q.type === 'input') {
        html += `
          <div>
            <input type="text" id="postal-input" placeholder="${q.placeholder}" maxlength="5" style="width: 100%; padding: 16px 20px; font-size: 16px; border: 2px solid #e2e8f0; border-radius: 20px; outline: none;" value="${answers.postalCode || ''}">
          </div>
        `;
      }
      
      html += `
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <button onclick="window.prevStep()" style="padding: 12px 24px; background: transparent; border: none; color: #64748b; cursor: pointer; font-weight: 500;">← Retour</button>
            <button onclick="window.nextStep()" style="padding: 12px 32px; background: #ff6b00; color: white; border: none; border-radius: 40px; cursor: pointer; font-weight: 600;">Suivant →</button>
          </div>
        </div>
      `;
      container.innerHTML = html;
      
      if (q.type === 'slider') {
        const slider = document.getElementById('surface-slider');
        const display = document.getElementById('surface-value');
        if (slider) {
          slider.oninput = function() {
            display.textContent = this.value;
            answers.surface = parseInt(this.value);
          };
        }
      }
    } else {
      // Afficher le résultat simplifié
      const total = (answers.surface || 80) * 120;
      container.innerHTML = `
        <div style="background: white; border-radius: 32px; padding: 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="font-size: 28px; margin-bottom: 24px;">Votre estimation</h2>
          <div style="font-size: 48px; font-weight: 800; color: #ff6b00;">${Math.round(total * 0.9).toLocaleString()}€ - ${Math.round(total * 1.1).toLocaleString()}€</div>
          <p style="margin: 24px 0; color: #64748b;">Basé sur ${answers.surface || 80}m² en ${answers.material === 'tuile' ? 'tuile' : answers.material || 'matériau standard'}</p>
          <button onclick="location.reload()" style="padding: 14px 32px; background: #ff6b00; color: white; border: none; border-radius: 40px; cursor: pointer; font-weight: 600;">Nouvelle estimation →</button>
        </div>
      `;
    }
  }
  
  window.selectAnswer = (id, value) => {
    answers[id] = value;
    render();
  };
  
  window.nextStep = () => {
    const q = questions[currentStep];
    if (q.type === 'input') {
      const input = document.getElementById('postal-input');
      if (input && input.value) answers[q.id] = input.value;
    }
    if (q.type === 'options' && !answers[q.id]) {
      alert('Veuillez sélectionner une option');
      return;
    }
    currentStep++;
    render();
  };
  
  window.prevStep = () => {
    if (currentStep > 0) {
      currentStep--;
      render();
    }
  };
  
  init();
})();
