@echo off
cd /d "%~dp0.."
if not exist "scripts\state" mkdir "scripts\state"
node scripts\run.js >> scripts\state\run.log 2>&1
