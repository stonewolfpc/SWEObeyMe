@echo off
echo [STONE WOLF SYSTEMS] Initializing SWEObeyMe Surgical Suite...
echo.
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from nodejs.org
    pause
    exit /b
)

echo Installing dependencies...
call npm install
echo.
echo [SUCCESS] SWEObeyMe is ready for surgery.
echo.
echo Add the following path to your mcp_config.json:
echo %cd%\index.js
echo.
pause
