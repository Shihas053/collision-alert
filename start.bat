@echo off
REM Collision Analysis System - Quick Start Script for Windows

echo ========================================
echo Collision Analysis System - Quick Start
echo ========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [32m[OK][0m Python found: %PYTHON_VERSION%
    set PYTHON_CMD=python
) else (
    echo [31m[ERROR][0m Python not found. Please install Python 3.11+
    pause
    exit /b 1
)

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [32m[OK][0m Node.js found: %NODE_VERSION%
) else (
    echo [31m[ERROR][0m Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

REM Check Yarn
echo Checking Yarn installation...
yarn --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('yarn --version') do set YARN_VERSION=%%i
    echo [32m[OK][0m Yarn found: %YARN_VERSION%
) else (
    echo [33m[WARNING][0m Yarn not found. Installing...
    npm install -g yarn
)

echo.
echo ========================================
echo Setting up Backend...
echo ========================================

cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    %PYTHON_CMD% -m venv venv
    echo [32m[OK][0m Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing Python dependencies...
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo [32m[OK][0m Backend dependencies installed

cd ..

echo.
echo ========================================
echo Setting up Frontend...
echo ========================================

cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
call yarn install --silent
echo [32m[OK][0m Frontend dependencies installed

cd ..

echo.
echo ========================================
echo Configuration Check
echo ========================================

REM Check backend .env
if exist "backend\.env" (
    echo [32m[OK][0m Backend .env file found
) else (
    echo [33m[WARNING][0m Backend .env file not found. Creating default...
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=collision_analysis_db
        echo CORS_ORIGINS=http://localhost:3000
        echo EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C
    ) > backend\.env
    echo [32m[OK][0m Default backend .env created
)

REM Check frontend .env
if exist "frontend\.env" (
    echo [32m[OK][0m Frontend .env file found
) else (
    echo [33m[WARNING][0m Frontend .env file not found. Creating default...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > frontend\.env
    echo [32m[OK][0m Default frontend .env created
)

echo.
echo ========================================
echo Starting Services...
echo ========================================
echo.
echo [32mStarting Backend on http://localhost:8001[0m
echo [32mStarting Frontend on http://localhost:3000[0m
echo.
echo Press Ctrl+C to stop both services
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend Server" cmd /k "cd frontend && yarn start"

echo.
echo Both services are starting in separate windows...
echo You can close this window now.
echo.
pause
