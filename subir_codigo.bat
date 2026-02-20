@echo off
echo ===========================================
echo   SUBIENDO CAMBIOS A PRODUCCION (SMART DENTIST)
echo ===========================================

echo 1. Guardando cambios...
git add .
git commit -m "Fix: Auth handling (403 logout) and added Logout button"

echo 2. Subiendo a GitHub...
git push origin main

echo.
echo ==========================================
echo PROCESO FINALIZADO.
echo Si ves letras verdes arriba, los cambios ya estan en camino a Render.
echo ==========================================
pause
