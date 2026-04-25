@echo off
REM Script para iniciar el servidor de desarrollo del frontend
REM Asegura que escuche en 0.0.0.0 para acceso desde red

echo ========================================
echo Iniciando Frontend SGRI
echo ========================================
echo.
echo El servidor se iniciara en: http://0.0.0.0:5173
echo Tambien disponible en: http://localhost:5173
echo.
echo Para acceder desde otro equipo o celular:
echo 1. Asegurate de estar en la misma red WiFi
echo 2. Usa la IP mostrada arriba (ej: http://10.10.17.26:5173)
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar con configuración explícita
set VITE_HOST=0.0.0.0
npm run dev -- --host 0.0.0.0

