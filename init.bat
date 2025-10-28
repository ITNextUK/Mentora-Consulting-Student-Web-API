@echo off
REM Mentora Student Web API - Initialization Script for Windows
REM This script sets up the project for first-time use

echo.
echo ========================================
echo  Mentora Student Web API Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 18 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed: 
node --version
echo.

REM Check if npm is installed
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed.
    pause
    exit /b 1
)
echo npm is installed:
npm --version
echo.

REM Install dependencies
echo [3/6] Installing dependencies...
echo This may take a few minutes...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Create .env file if it doesn't exist
echo [4/6] Setting up environment configuration...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo .env file created! Please edit it with your database credentials.
    echo IMPORTANT: Update the following in .env file:
    echo   - DB_PASSWORD
    echo   - JWT_SECRET
    echo   - SMTP credentials (if using email features^)
    echo.
) else (
    echo .env file already exists. Skipping...
    echo.
)

REM Create upload directories
echo [5/6] Creating upload directories...
if not exist uploads\cv (
    mkdir uploads\cv
    echo Created: uploads\cv
)
if not exist uploads\profilePictures (
    mkdir uploads\profilePictures
    echo Created: uploads\profilePictures
)
if not exist logs (
    mkdir logs
    echo Created: logs
)
echo Upload directories ready!
echo.

REM Display next steps
echo [6/6] Setup Complete!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo.
echo 1. Edit .env file with your configuration:
echo    - Database credentials (DB_PASSWORD^)
echo    - JWT secret (JWT_SECRET^)
echo    - CORS origin (CORS_ORIGIN^)
echo.
echo 2. Run database migration:
echo    npm run migrate
echo.
echo 3. Start the server:
echo    npm run dev  (development mode^)
echo    npm start    (production mode^)
echo.
echo 4. Test the API:
echo    curl http://localhost:5001/health
echo.
echo ========================================
echo  Documentation:
echo ========================================
echo.
echo - README.md - Main documentation
echo - SETUP.md - Detailed setup guide
echo - API_DOCUMENTATION.md - API reference
echo - PROJECT_SUMMARY.md - Complete overview
echo.
echo ========================================
echo.

pause
