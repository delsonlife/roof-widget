const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const code = fs.readFileSync('public/widget.js', 'utf8');
const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4']
});
fs.writeFileSync('public/widget.min.js', result.getObfuscatedCode());
console.log('✅ widget.min.js généré');
