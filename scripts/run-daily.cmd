@echo off
cd /d "%~dp0.."
node scripts\run.js >> scripts\state\run.log 2>&1
