const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Lire votre widget actuel
const code = fs.readFileSync('public/widget.js', 'utf8');

// Obfusquer
const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4']
});

// Créer la version obfusquée
fs.writeFileSync('public/widget.min.js', result.getObfuscatedCode());
console.log('✅ widget.min.js généré');
