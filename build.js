const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

// Lire le fichier source
const code = fs.readFileSync('public/widget.js', 'utf8');

// Obfusquer
const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true
});

// Écrire le fichier obfusqué
fs.writeFileSync('public/widget.min.js', result.getObfuscatedCode());
console.log('✅ widget.min.js généré avec succès');
