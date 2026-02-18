@echo off
echo ===========================================
echo   CONFIGURANDO PROYECTO PARA GITHUB (v3)
echo ===========================================

echo 1. Inicializando repositorio...
if not exist .git (
    git init
)

echo 2. Configurando identidad de Git (Para evitar el error anterior)...
git config user.email "admin@smartdentist.app"
git config user.name "Smart Dentist Admin"

echo 3. Creando lista de archivos ignorados...
(
echo node_modules/
echo client/node_modules/
echo server/node_modules/
echo dist/
echo client/dist/
echo .env
echo .DS_Store
echo dental.db
echo dental.db-journal
echo *.log
) > .gitignore

echo 4. Guardando archivos...
git add .
git commit -m "Initial release v1.0"

echo 5. Conectando con GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/damurill/Smart-Dentist.git
git branch -M main

echo 6. SUBIENDO CODIGO...
git push -u origin main

echo.
echo ==========================================
echo PROCESO FINALIZADO.
echo Si ves letras verdes arriba diciendo "main -> main", ¡TODO SALIO BIEN!
echo ==========================================
pause
