@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

title DeviceM - Update and Deploy

echo ========================================
echo   DeviceM - Update and Deploy
echo ========================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git is not installed or not available in PATH.
  goto :fail
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js and npm are not installed or not available in PATH.
  goto :fail
)

for /f %%i in ('git status --porcelain') do (
  echo ERROR: There are local changes. Save or commit them before updating.
  goto :fail
)

echo [1/4] Downloading the latest version from GitHub...
git pull --rebase origin main
if errorlevel 1 goto :fail

cd /d "%~dp0frontend"

echo.
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 goto :fail

echo.
echo [3/4] Verifying the production build...
call npm run build
if errorlevel 1 goto :fail

where vercel >nul 2>nul
if errorlevel 1 (
  echo.
  echo Vercel CLI is missing. Installing it now...
  call npm install --global vercel@latest
  if errorlevel 1 goto :fail
)

echo.
echo [4/4] Deploying to Vercel Production...
call vercel deploy --prod --yes
if errorlevel 1 goto :fail

echo.
echo ========================================
echo   Update and deployment completed.
echo   https://devicem.vercel.app
echo ========================================
goto :end

:fail
echo.
echo ========================================
echo   Update stopped because of an error.
echo   Review the message above.
echo ========================================

:end
echo.
pause
endlocal