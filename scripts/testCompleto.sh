#!/bin/bash

# Script para testar backend e frontend completos

echo "=========================================="
echo "TESTE COMPLETO - BACKEND E FRONTEND"
echo "=========================================="
echo ""

# Testar backend
echo "=== TESTANDO BACKEND ==="
cd backend
node scripts/testBackendCompleto.js
BACKEND_STATUS=$?
cd ..

echo ""
echo "=== TESTANDO FRONTEND ==="
cd frontend-react
node scripts/testFrontendCompleto.js
FRONTEND_STATUS=$?
cd ..

echo ""
echo "=========================================="
echo "RESULTADO FINAL"
echo "=========================================="

if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo "OK: Backend e Frontend estão sem erros!"
    exit 0
else
    echo "ERRO: Alguns problemas foram encontrados"
    if [ $BACKEND_STATUS -ne 0 ]; then
        echo "  - Backend tem erros"
    fi
    if [ $FRONTEND_STATUS -ne 0 ]; then
        echo "  - Frontend tem erros"
    fi
    exit 1
fi

