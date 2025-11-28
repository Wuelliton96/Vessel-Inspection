#!/usr/bin/env node

/**
 * Script para validar cobertura de testes antes de fazer push
 * Garante que a cobertura está acima de 50% combinando backend e frontend
 */

const fs = require('fs');
const path = require('path');

const TARGET_COVERAGE = 50; // 50% mínimo

function parseLcov(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo de cobertura nao encontrado: ${filePath}`);
    return { total: 0, covered: 0, percentage: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let total = 0;
  let covered = 0;

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('DA:')) {
      // DA:line_number,execution_count
      const parts = line.substring(3).split(',');
      if (parts.length >= 2) {
        const hits = parseInt(parts[1], 10) || 0;
        total += 1;
        if (hits > 0) {
          covered += 1;
        }
      }
    }
  }

  const percentage = total > 0 ? (covered / total) * 100 : 0;
  return { total, covered, percentage };
}

function main() {
  console.log('Validando cobertura de testes...\n');

  const backendLcov = path.join(__dirname, '..', 'backend', 'coverage', 'lcov.info');
  const frontendLcov = path.join(__dirname, '..', 'frontend-react', 'coverage', 'lcov.info');

  const backendCoverage = parseLcov(backendLcov);
  const frontendCoverage = parseLcov(frontendLcov);

  console.log('Resultados:');
  console.log(`   Backend:  ${backendCoverage.percentage.toFixed(2)}% (${backendCoverage.covered}/${backendCoverage.total} linhas)`);
  console.log(`   Frontend: ${frontendCoverage.percentage.toFixed(2)}% (${frontendCoverage.covered}/${frontendCoverage.total} linhas)`);

  // Calcular cobertura combinada (ponderada por número de linhas)
  const totalLines = backendCoverage.total + frontendCoverage.total;
  const totalCovered = backendCoverage.covered + frontendCoverage.covered;
  const combinedCoverage = totalLines > 0 ? (totalCovered / totalLines) * 100 : 0;

  console.log(`\nCobertura Combinada: ${combinedCoverage.toFixed(2)}%`);
  console.log(`   Total: ${totalCovered}/${totalLines} linhas cobertas\n`);

  if (combinedCoverage >= TARGET_COVERAGE) {
    console.log(`Cobertura acima de ${TARGET_COVERAGE}%! (${combinedCoverage.toFixed(2)}%)`);
    console.log('Pronto para fazer push!\n');
    process.exit(0);
  } else {
    console.error(`Cobertura abaixo de ${TARGET_COVERAGE}%! (${combinedCoverage.toFixed(2)}%)`);
    console.error(`Adicione mais testes antes de fazer push.\n`);
    
    if (backendCoverage.total === 0) {
      console.error('Backend: Execute "npm run test:coverage" no diretorio backend');
    }
    if (frontendCoverage.total === 0) {
      console.error('Frontend: Execute "npm run test:coverage" no diretorio frontend-react');
    }
    
    process.exit(1);
  }
}

main();

