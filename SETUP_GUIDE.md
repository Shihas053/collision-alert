# Complete Setup Guide for VS Code

## Step 1: Export Your Code from Emergent

### Option A: Download as ZIP
1. Go to your Emergent project dashboard
2. Click on "Download" or "Export" button
3. Save the ZIP file to your computer
4. Extract it to your desired location

### Option B: Push to GitHub (Recommended)
1. In Emergent dashboard, click "Push to GitHub"
2. Authenticate with GitHub
3. Create/select repository
4. Clone to your local machine:
   ```bash
   git clone https://github.com/yourusername/collision-analysis.git
   cd collision-analysis
   ```

## Step 2: Install Prerequisites

### Install Python 3.11+

**Windows:**
1. Download from: https://www.python.org/downloads/
2. Run installer, check "Add Python to PATH"
3. Verify: `python --version`

**Mac:**
```bash
brew install python@3.11
python3 --version
```

**Linux:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
python3.11 --version
```

### Install Node.js & Yarn

**All Platforms:**
1. Download Node.js from: https://nodejs.org/ (LTS version)
2. Install Yarn:
   ```bash
   npm install -g yarn
   yarn --version
   ```

### Install MongoDB

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer with default settings
3. Start MongoDB:
   - Search "Services" → Find "MongoDB Server" → Start

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

Verify MongoDB:
```bash
mongo --version
# or
mongosh --version
```

### Install VS Code

1. Download from: https://code.visualstudio.com/
2. Install recommended extensions when prompted

## Step 3: Open Project in VS Code

```bash
cd /path/to/collision-analysis
code .
```

Or:
- Open VS Code
- File → Open Folder
- Select your project folder

## Step 4: Install VS Code Extensions

When you open the project, VS Code will prompt to install recommended extensions. Click "Install All".

Or manually install:
1. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
2. Search and install:
   - Python
   - Pylance
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - MongoDB for VS Code

## Step 5: Configure Environment Files

### Backend Environment

Edit `/backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=collision_analysis_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C

# Optional: Add Twilio for SMS
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend Environment

Edit `/frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Step 6: Install Dependencies

### Option A: Using VS Code Tasks (Easiest)

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select "Start All Services"
4. Wait for both backend and frontend to start

### Option B: Manual Installation

**Terminal 1 - Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend

# Install dependencies
yarn install

# Run frontend
yarn start
```

## Step 7: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## Step 8: Test the Application

1. **Add Emergency Contact**:
   - Go to http://localhost:3000/contacts
   - Click "Add Contact"
   - Fill in details (name, phone, role)
   - Save

2. **Analyze Video**:
   - Go to http://localhost:3000/analyze
   - Upload a collision video
   - Click "Analyze Collision"
   - View results and automatic alerts

3. **View History**:
   - Go to http://localhost:3000/history
   - See all past analyses

## Troubleshooting

### Issue: "Python not found"
**Solution:**
```bash
# Check Python installation
python --version
python3 --version

# Try using python3 instead
python3 -m venv venv
```

### Issue: "Module not found: emergentintegrations"
**Solution:**
```bash
cd backend
source venv/bin/activate
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Issue: "MongoDB connection failed"
**Solution:**
```bash
# Check if MongoDB is running
# Windows:
services.msc → MongoDB Server → Start

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
sudo systemctl status mongod
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "yarn: command not found"
**Solution:**
```bash
npm install -g yarn
# Or use npm instead:
cd frontend
npm install
npm start
```

## VS Code Keyboard Shortcuts

- `Ctrl+Shift+P`: Command Palette
- `Ctrl+Shift+B`: Run Build Task (Start Services)
- `Ctrl+\``: Toggle Terminal
- `Ctrl+Shift+\``: New Terminal
- `F5`: Start Debugging
- `Ctrl+K Ctrl+O`: Open Folder

## Deployment to Website

### Keep Using Emergent (Easiest)
Your app is already live at:
https://auto-incident-deploy.preview.emergentagent.com

### Deploy to Vercel + Railway

**Frontend (Vercel):**
1. Push code to GitHub
2. Go to https://vercel.com/
3. Import your repository
4. Set build command: `cd frontend && yarn build`
5. Set output directory: `frontend/build`
6. Add environment variable: `REACT_APP_BACKEND_URL=<your-backend-url>`
7. Deploy

**Backend (Railway):**
1. Go to https://railway.app/
2. New Project → Deploy from GitHub
3. Select your repository
4. Set root directory: `/backend`
5. Add environment variables from `.env`
6. Deploy

**Database (MongoDB Atlas):**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Get connection string
4. Update MONGO_URL in Railway environment

## Next Steps

1. ✅ Set up Twilio for real SMS alerts
2. ✅ Test with actual collision videos
3. ✅ Configure custom domain
4. ✅ Set up monitoring and logging
5. ✅ Add backup and recovery

## Getting Help

- **Documentation**: Check README.md
- **API Docs**: http://localhost:8001/docs
- **Emergent Support**: support@emergent.sh
- **GitHub Issues**: Create issue in your repo

---

**Congratulations! Your collision analysis system is now running locally! 🎉**
