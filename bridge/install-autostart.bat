@echo off
rem One-time setup: installs dependencies and makes the bridge start when this user logs in.
rem Uses the user's Startup folder, so no administrator rights are needed.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node 20.6 or newer from nodejs.org, then run this again. & pause & exit /b 1)
if not exist .env (echo .env is missing. Copy .env.example to .env and fill it in first. & pause & exit /b 1)
call npm install --omit=dev || (echo npm install failed. & pause & exit /b 1)

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
> "%STARTUP%\GymFingerprintBridge.cmd" echo @echo off
>> "%STARTUP%\GymFingerprintBridge.cmd" echo start "" wscript.exe "%~dp0start-hidden.vbs"
if not exist "%STARTUP%\GymFingerprintBridge.cmd" (echo Could not create the startup entry. & pause & exit /b 1)

rem start it now
start "" wscript.exe "%~dp0start-hidden.vbs"
echo.
echo Done. The bridge is running in the background and will start automatically at every login.
echo Logs are written to bridge.log in this folder.
pause
