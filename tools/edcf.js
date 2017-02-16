const transformer = require('eslint-to-editorconfig');
const eslintRules = transformer.getEslintRules();

console.log(eslintRules);
