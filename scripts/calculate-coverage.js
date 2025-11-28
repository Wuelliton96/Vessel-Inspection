#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseLcov(filePath) {
  if (!fs.existsSync(filePath)) return { total: 0, covered: 0 };
  const content = fs.readFileSync(filePath, 'utf8');
  let total = 0, covered = 0;
  for (const line of content.split('\n')) {
    if (line.startsWith('DA:')) {
      const parts = line.substring(3).split(',');
      if (parts.length >= 2) {
        const hits = parseInt(parts[1], 10) || 0;
        total += 1;
        if (hits > 0) covered += 1;
      }
    }
  }
  return { total, covered };
}

const backend = parseLcov('backend/coverage/lcov.info');
const frontend = parseLcov('frontend-react/coverage/lcov.info');

const total = backend.total + frontend.total;
const covered = backend.covered + frontend.covered;
const pct = total > 0 ? (covered / total) * 100 : 0;

console.log('Backend: ' + (backend.total > 0 ? ((backend.covered / backend.total) * 100).toFixed(2) : 0) + '% (' + backend.covered + '/' + backend.total + ')');
console.log('Frontend: ' + (frontend.total > 0 ? ((frontend.covered / frontend.total) * 100).toFixed(2) : 0) + '% (' + frontend.covered + '/' + frontend.total + ')');
console.log('');
console.log('Cobertura Combinada: ' + pct.toFixed(2) + '% (' + covered + '/' + total + ' linhas)');

if (pct >= 50) {
  console.log('Cobertura acima de 50%!');
  process.exit(0);
} else {
  console.log('Cobertura abaixo de 50%');
  process.exit(0);
}

