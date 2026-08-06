# Collision Analysis System

AI-powered collision video analysis system with automatic emergency alert dispatch.

## Features

- 🎥 **Video Analysis**: Upload collision videos for AI-powered severity classification
- 🤖 **OpenAI GPT-5.2 Vision**: Classifies collisions as Normal, Mild, or Severe
- 📱 **Automatic SMS Alerts**: Instant notifications to emergency services via Twilio
- 👥 **Contact Management**: Configure Police, Ambulance, and Fire Department contacts
- 📊 **Analysis Dashboard**: Real-time monitoring and historical analysis tracking
- 🎨 **Professional UI**: Dark-themed command center interface

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React 19 with Tailwind CSS
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via emergentintegrations
- **Alerts**: Twilio SMS API

## Local Development Setup

### Prerequisites

1. **Python 3.11+**
   ```bash
   python --version
   ```

2. **Node.js 18+ & Yarn**
   ```bash
   node --version
   yarn --version
   ```

3. **MongoDB**
   - Install from: https://www.mongodb.com/try/download/community
   - Start MongoDB service

### Installation Steps

#### 1. Clone/Download the Repository

If using Git:
```bash
git clone <your-repo-url>
cd collision-analysis-system
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
yarn install
```

#### 4. Environment Configuration

**Backend `.env` file** (`/backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=collision_analysis_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C

# Optional: Add your Twilio credentials for SMS alerts
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**Frontend `.env` file** (`/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Running the Application

#### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will run on: http://localhost:8001

#### Terminal 2 - Frontend:
```bash
cd frontend
yarn start
```

Frontend will run on: http://localhost:3000

### VS Code Setup

1. **Open in VS Code**:
   ```bash
   code .
   ```

2. **Recommended Extensions**:
   - Python (Microsoft)
   - Pylance
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense

3. **VS Code Tasks** (`.vscode/tasks.json`):
   ```json
   {
     "version": "2.0.0",
     "tasks": [
       {
         "label": "Start Backend",
         "type": "shell",
         "command": "cd backend && source venv/bin/activate && uvicorn server:app --reload",
         "problemMatcher": [],
         "group": "build"
       },
       {
         "label": "Start Frontend",
         "type": "shell",
         "command": "cd frontend && yarn start",
         "problemMatcher": [],
         "group": "build"
       }
     ]
   }
   ```

4. **Run Both Services**:
   - Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
   - Select "Start Backend" in one terminal
   - Open new terminal and select "Start Frontend"

## Usage

1. **Configure Emergency Contacts**:
   - Navigate to "Contacts" section
   - Add Police, Ambulance, and Fire Department contacts with phone numbers

2. **Analyze Collision Video**:
   - Go to "Analyze" page
   - Upload a collision video (MP4, MOV, AVI, etc.)
   - Click "Analyze Collision"
   - AI will classify severity and automatically send alerts

3. **View Results**:
   - Check "Dashboard" for overview and stats
   - Visit "History" for all past analyses

## Alert Logic

- **Normal**: Police notified only
- **Mild Impact**: Police + Ambulance notified
- **Severe Collision**: Police + Ambulance + Fire Department notified

## Deployment

### Option 1: Emergent Platform (Easiest)
- Already deployed at: https://auto-incident-deploy.preview.emergentagent.com
- Use Emergent's native deployment features

### Option 2: Vercel + Railway
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway or Render
- **Database**: MongoDB Atlas (free tier)

### Option 3: Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Troubleshooting

### Backend Issues

**ModuleNotFoundError**:
```bash
pip install -r requirements.txt
```

**MongoDB Connection Error**:
- Ensure MongoDB is running: `mongod --version`
- Check MONGO_URL in `.env`

### Frontend Issues

**Dependencies Error**:
```bash
rm -rf node_modules yarn.lock
yarn install
```

**Port Already in Use**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000   # Windows
```

## API Endpoints

### Backend API (`/api`)

- `GET /api/` - Health check
- `POST /api/analyze` - Upload and analyze video
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create contact
- `DELETE /api/contacts/{id}` - Delete contact
- `GET /api/analysis-history` - Get all analyses

## Project Structure

```
collision-analysis-system/
├── backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app component
│   │   ├── pages/         # Page components
│   │   └── components/    # Reusable components
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment variables
└── README.md
```

## API Keys

### Emergent LLM Key (Included)
- Pre-configured universal key for OpenAI GPT-5.2
- Works out of the box for testing
- For production, consider getting your own OpenAI API key

### Twilio SMS (Optional)
1. Sign up at: https://www.twilio.com/
2. Get Account SID, Auth Token, and Phone Number
3. Add to backend `.env` file

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues or questions:
- Check troubleshooting section above


---


