@echo off
title Studio Beauty - Servidores
echo ===================================================
echo   Iniciando o Sistema Studio Beauty...
echo ===================================================

echo [1/2] Iniciando Servidor Backend (Porta 3001)...
start "Studio Beauty - Backend API (Porta 3001)" /D "%~dp0server" cmd /k "npm start"

timeout /t 2 /nobreak > nul

echo [2/2] Iniciando Site Frontend (Porta 5173)...
start "Studio Beauty - Frontend Site (Porta 5173)" /D "%~dp0client" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo Abrindo o site no navegador...
start http://localhost:5173

echo ===================================================
echo   Sistema iniciado com sucesso!
echo   Acesse: http://localhost:5173
echo ===================================================
