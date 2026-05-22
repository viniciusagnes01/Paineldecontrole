@echo off
npm run check
if errorlevel 1 exit /b 1
npm run dev
