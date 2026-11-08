@echo off
rem One-time setup: installs dependencies and makes the bridge start when this user logs in.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node 20.6 or newer from nodejs.org, then run this again. & pause & exit /b 1)
if not exist .env (echo .env is missing. Copy .env.example to .env and fill it in first. & pause & exit /b 1)
call npm install --omit=dev || (echo npm install failed. & pause & exit /b 1)
schtasks /Create /TN "GymFingerprintBridge" /TR "wscript.exe \"%~dp0start-hidden.vbs\"" /SC ONLOGON /RL LIMITED /F || (echo Could not create the startup task. & pause & exit /b 1)
schtasks /Run /TN "GymFingerprintBridge"
echo.
echo Done. The bridge is running in the background and will start automatically at every login.
echo Logs are written to bridge.log in this folder.
pause
