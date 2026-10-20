@echo off
title IM LOCATION - Windows Desktop App Builder
color 0E

echo ============================================================
echo   IM LOCATION - Car Rental POS [Algérie]
echo   Windows Desktop Application Builder (.EXE)
echo ============================================================
echo.

echo [1/3] Verification des dependances Node.js et NPM...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe. Veuillez installer Node.js depuis https://nodejs.org
    pause
    exit /b
)

echo [2/3] Installation des outils Electron...
call npm install electron electron-builder concurrently --save-dev

echo [3/3] Compilation du package Windows (.EXE)...
call npm run electron:build

echo.
echo ============================================================
echo   Compilation terminee avec succes !
echo   Votre fichier installateur .exe est disponible dans le dossier :
echo   release/
echo ============================================================
pause
