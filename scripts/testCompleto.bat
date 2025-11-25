@echo off
REM Script para testar backend e frontend completos (Windows)

echo ==========================================
echo TESTE COMPLETO - BACKEND E FRONTEND
echo ==========================================
echo.

REM Testar backend
echo === TESTANDO BACKEND ===
cd backend
node scripts/testBackendCompleto.js
set BACKEND_STATUS=%ERRORLEVEL%
cd ..

echo.
echo === TESTANDO FRONTEND ===
cd frontend-react
node scripts/testFrontendCompleto.js
set FRONTEND_STATUS=%ERRORLEVEL%
cd ..

echo.
echo ==========================================
echo RESULTADO FINAL
echo ==========================================

if %BACKEND_STATUS% EQU 0 (
    if %FRONTEND_STATUS% EQU 0 (
        echo OK: Backend e Frontend estao sem erros!
        exit /b 0
    ) else (
        echo ERRO: Frontend tem erros
        exit /b 1
    )
) else (
    if %FRONTEND_STATUS% EQU 0 (
        echo ERRO: Backend tem erros
        exit /b 1
    ) else (
        echo ERRO: Backend e Frontend tem erros
        exit /b 1
    )
)

