@echo off
echo ===========================================
echo   SUBIENDO CORRECCIONES A GITHUB
echo ===========================================

echo 1. Guardando cambios recientes...
git add .
git commit -m "Fix deployment error (Express 5 wildcard)"

echo 2. Enviando a la nube...
git push origin main

echo.
echo ==========================================
echo PROCESO FINALIZADO.
echo Si ves letras verdes arriba diciendo "main -> main", ¡TODO SALIO BIEN!
echo ==========================================
pause
