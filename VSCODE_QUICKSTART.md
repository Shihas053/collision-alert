# 🚀 Quick Start: Run Collision Analysis in VS Code

## ⚡ Super Fast Setup (5 Minutes)

### Step 1: Get Your Code (Choose One Method)

#### Method A: Push to GitHub (Easiest)
```bash
# In Emergent Dashboard:
1. Click "Push to GitHub" button
2. Authorize GitHub
3. Create repository name: "collision-analysis"
4. Wait for push to complete

# On Your Computer:
git clone https://github.com/YOUR_USERNAME/collision-analysis.git
cd collision-analysis
code .
```

#### Method B: Download ZIP
```bash
# In Emergent Dashboard:
1. Click "Download" or "Export"
2. Save ZIP file
3. Extract to folder

# On Your Computer:
cd path/to/extracted/folder
code .
```

---

## Step 2: Install Required Software

### ✅ Install Python 3.11+
**Windows:** https://www.python.org/downloads/ ✓ Check "Add to PATH"  
**Mac:** `brew install python@3.11`  
**Linux:** `sudo apt install python3.11 python3.11-venv python3-pip`

**Verify:**
```bash
python --version
# or
python3 --version
```

### ✅ Install Node.js 18+
**All Platforms:** https://nodejs.org/ (Download LTS version)

**Then install Yarn:**
```bash
npm install -g yarn
yarn --version
```

### ✅ Install MongoDB
**Windows:** https://www.mongodb.com/try/download/community  
**Mac:** `brew tap mongodb/brew && brew install mongodb-community`  
**Linux:** 
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install -y mongodb-org
```

**Start MongoDB:**
- Windows: Services → MongoDB Server → Start
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

---

## Step 3: VS Code Setup

### Install VS Code Extensions
Open VS Code, press `Ctrl+Shift+X`, search and install:
- Python (Microsoft)
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

## Step 4: Configure Environment Files

### Backend Environment
Create/Edit `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=collision_analysis_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C

# Optional: Add your Twilio credentials
# TWILIO_ACCOUNT_SID=your_sid_here
# TWILIO_AUTH_TOKEN=your_token_here
# TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend Environment
Create/Edit `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Step 5: Install Dependencies & Run

### Option A: Use Quick Start Scripts (Easiest!)

**Windows:**
```bash
# Double-click: start.bat
# Or in terminal:
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

The script will:
✅ Install all dependencies automatically  
✅ Start backend on http://localhost:8001  
✅ Start frontend on http://localhost:3000  
✅ Open browser automatically  

---

### Option B: Manual Start (More Control)

#### Terminal 1 - Backend:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

✅ Backend running at: http://localhost:8001

#### Terminal 2 - Frontend:
```bash
cd frontend

# Install dependencies
yarn install

# Run frontend
yarn start
```

✅ Frontend running at: http://localhost:3000

---

## Step 6: Test the Application

### Quick Test Checklist:

1. **Open Browser:** http://localhost:3000
2. **Check Dashboard:** Should show "Command Center"
3. **Add Emergency Contact:**
   - Click "Contacts"
   - Click "Add Contact"
   - Fill: Name, Phone, Role
   - Add Location (Latitude/Longitude) for ETA
   - Save

4. **Test Video Analysis:**
   - Click "Analyze"
   - Optional: Enable GPS and enter coordinates
   - Upload a video (any video works for testing)
   - Click "Analyze Collision"
   - Wait for results

5. **Check History:**
   - Click "History"
   - Should see your analysis

---

## 🎯 Using VS Code Tasks (Advanced)

### Run with Keyboard Shortcut:

1. Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
2. Select "Start All Services"
3. Both backend and frontend start automatically!

**Configured in:** `.vscode/tasks.json`

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: "ModuleNotFoundError"**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**Error: "MongoDB connection failed"**
```bash
# Check if MongoDB is running
# Windows: services.msc → MongoDB Server
# Mac: brew services list
# Linux: sudo systemctl status mongod
```

---

### Frontend Won't Start

**Error: "Port 3000 already in use"**
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Error: "yarn: command not found"**
```bash
npm install -g yarn
# Or use npm instead:
cd frontend
npm install
npm start
```

---

### MongoDB Issues

**Error: "mongod: command not found"**
- MongoDB not installed or not in PATH
- Re-install MongoDB and restart terminal

**Error: "Connection refused"**
```bash
# Start MongoDB
# Windows: Services → MongoDB Server → Start
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

---

## 📁 Project Structure Overview

```
collision-analysis/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend config
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React app
│   │   ├── pages/        # Dashboard, Analyze, etc.
│   │   └── components/   # Reusable components
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend config
├── .vscode/
│   ├── tasks.json       # VS Code tasks
│   └── settings.json    # VS Code settings
├── start.sh             # Quick start (Mac/Linux)
├── start.bat            # Quick start (Windows)
└── README.md            # Full documentation
```

---

## 🔑 Getting API Keys

### Emergent LLM Key (Already Included!)
✅ Pre-configured: `sk-emergent-f2b0bB1A5FdBb02C2C`  
✅ Works for: OpenAI GPT-5.2 vision analysis  
✅ No setup needed  

### Twilio SMS (Optional)
To enable SMS alerts:
1. Sign up: https://www.twilio.com/
2. Get Account SID, Auth Token, Phone Number
3. Add to `backend/.env`

---

## ⚡ VS Code Tips

### Keyboard Shortcuts:
- `Ctrl+` ` → Toggle terminal
- `Ctrl+Shift+` ` → New terminal
- `Ctrl+Shift+B` → Run build task
- `Ctrl+K Ctrl+O` → Open folder
- `Ctrl+P` → Quick file open

### Split Terminals:
1. Open terminal (`Ctrl+` `)
2. Click split icon (⊞) in terminal panel
3. Run backend in left, frontend in right

### Debugging:
- Set breakpoints in Python code
- Press F5 to start debugging
- Check Variables, Call Stack, etc.

---

## 📊 Verify Everything Works

### Backend Health Check:
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Collision Analysis API"}
```

### Frontend Check:
```bash
# Open browser: http://localhost:3000
# Should see: COLLISION AI dashboard
```

### Database Check:
```bash
mongosh
> show dbs
> use collision_analysis_db
> show collections
```

---

## 🎉 Success! You're Running Locally

### Access Your Application:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

### What's Working:
✅ Video upload and analysis  
✅ OpenAI GPT-5.2 vision (collision classification)  
✅ GPS extraction and manual input  
✅ Traffic information  
✅ ETA calculations  
✅ Emergency contact management  
✅ Analysis history  
✅ SMS alerts (if Twilio configured)  

---

## 🔄 Daily Development Workflow

### Start Working:
```bash
# Method 1: Quick start
./start.sh  # or start.bat on Windows

# Method 2: VS Code task
Ctrl+Shift+B → Start All Services

# Method 3: Manual terminals
Terminal 1: cd backend && source venv/bin/activate && uvicorn server:app --reload
Terminal 2: cd frontend && yarn start
```

### Stop Services:
- Press `Ctrl+C` in each terminal
- Or close terminals

---

## 📚 Next Steps

1. ✅ Add Twilio credentials for SMS
2. ✅ Add emergency contact locations for ETA
3. ✅ Test with real collision videos
4. ✅ Customize UI/features
5. ✅ Deploy to production (see DEPLOYMENT_GUIDE.md)

---

## 🆘 Need More Help?

### Documentation:
- `README.md` - Complete project overview
- `SETUP_GUIDE.md` - Detailed setup (322 lines)
- `DEPLOYMENT_GUIDE.md` - Deploy to production
- `GPS_FEATURE_GUIDE.md` - GPS features
- `ETA_CALCULATION_GUIDE.md` - ETA features

### Support:
- Emergent Support: support@emergent.sh
- Check backend logs: `backend/*.log`
- Check frontend console: Browser DevTools (F12)

---

## ✅ Quick Reference Card

| Task | Command |
|------|---------|
| Start Backend | `cd backend && source venv/bin/activate && uvicorn server:app --reload` |
| Start Frontend | `cd frontend && yarn start` |
| Install Backend Deps | `cd backend && pip install -r requirements.txt` |
| Install Frontend Deps | `cd frontend && yarn install` |
| Check Backend Health | `curl http://localhost:8001/api/` |
| View API Docs | http://localhost:8001/docs |
| Open Application | http://localhost:3000 |
| MongoDB Shell | `mongosh` |
| Kill Port 3000 | `lsof -ti:3000 \| xargs kill -9` (Mac/Linux) |
| Kill Port 8001 | `lsof -ti:8001 \| xargs kill -9` (Mac/Linux) |

---

**🎊 You're all set! Happy coding!** 

Your collision analysis system is now running locally in VS Code. Start building and testing! 🚀
