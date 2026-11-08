@echo off
rem Runs the fingerprint bridge and restarts it if it ever stops.
cd /d "%~dp0"
:loop
node --env-file=.env index.mjs >> bridge.log 2>&1
timeout /t 10 /nobreak >nul
goto loop
