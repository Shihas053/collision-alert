#!/bin/bash

# Collision Analysis System - Quick Start Script
# This script sets up and runs the application locally

echo "========================================"
echo "Collision Analysis System - Quick Start"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python
else
    echo -e "${RED}✗ Python not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Check Node.js
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check Yarn
echo "Checking Yarn installation..."
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✓ Yarn found: $YARN_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Yarn not found. Installing...${NC}"
    npm install -g yarn
fi

# Check MongoDB
echo "Checking MongoDB installation..."
if command -v mongod &> /dev/null; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    echo -e "${GREEN}✓ MongoDB found: $MONGO_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB not found. Please install MongoDB${NC}"
    echo "   Download from: https://www.mongodb.com/try/download/community"
fi

echo ""
echo "========================================"
echo "Setting up Backend..."
echo "========================================"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..

echo ""
echo "========================================"
echo "Setting up Frontend..."
echo "========================================"

cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
yarn install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

echo ""
echo "========================================"
echo "Configuration Check"
echo "========================================"

# Check backend .env
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env file found${NC}"
else
    echo -e "${YELLOW}⚠ Backend .env file not found. Creating default...${NC}"
    cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=collision_analysis_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C
EOF
    echo -e "${GREEN}✓ Default backend .env created${NC}"
fi

# Check frontend .env
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓ Frontend .env file found${NC}"
else
    echo -e "${YELLOW}⚠ Frontend .env file not found. Creating default...${NC}"
    cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓ Default frontend .env created${NC}"
fi

echo ""
echo "========================================"
echo "Starting Services..."
echo "========================================"

echo ""
echo -e "${GREEN}Starting Backend on http://localhost:8001${NC}"
echo -e "${GREEN}Starting Frontend on http://localhost:3000${NC}"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
cd frontend
yarn start &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
