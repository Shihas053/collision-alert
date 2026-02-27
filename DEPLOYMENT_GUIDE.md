# Deployment Guide - Make Your Collision Analysis System Public

## Overview

Your collision analysis system can be deployed as a public website using several methods. This guide covers the easiest and most popular options.

## Current Deployment

Your app is **already live** on Emergent platform:
- **URL**: https://auto-incident-deploy.preview.emergentagent.com
- **Status**: Fully functional with automatic deployment
- **Features**: Backend, Frontend, MongoDB all managed

## Option 1: Keep Using Emergent (Recommended for Quick Deployment)

### Advantages
- ✅ Already deployed and working
- ✅ Zero configuration needed
- ✅ Automatic SSL/HTTPS
- ✅ Built-in MongoDB
- ✅ Auto-scaling
- ✅ No server management

### Custom Domain Setup
1. Go to your Emergent dashboard
2. Navigate to Settings → Custom Domain
3. Add your domain (e.g., collision-ai.com)
4. Update DNS records as instructed
5. SSL certificate automatically provisioned

### Production Checklist
- [ ] Configure Twilio credentials for SMS
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Review security settings
- [ ] Set up custom domain (optional)

## Option 2: Deploy to Vercel + Railway (Popular Choice)

### Architecture
- **Frontend**: Vercel (Free tier available)
- **Backend**: Railway (Free $5/month credit)
- **Database**: MongoDB Atlas (Free tier 512MB)

### Step-by-Step Instructions

#### A. Deploy Database (MongoDB Atlas)

1. **Create Account**:
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up (free)

2. **Create Cluster**:
   - Choose "Shared" (Free tier)
   - Select region closest to users
   - Click "Create Cluster"

3. **Configure Access**:
   - Database Access → Add New User
   - Username: `admin`
   - Password: Generate secure password
   - Privileges: Read and write to any database
   
4. **Whitelist IPs**:
   - Network Access → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0`

5. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/`

#### B. Deploy Backend (Railway)

1. **Push Code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m \"Initial commit\"\n   git remote add origin https://github.com/yourusername/collision-analysis.git\n   git push -u origin main\n   ```

2. **Deploy on Railway**:
   - Go to https://railway.app/
   - Sign in with GitHub
   - Click \"New Project\" → \"Deploy from GitHub repo\"
   - Select your repository
   - Choose \"backend\" folder as root directory

3. **Configure Environment Variables**:
   Click on your service → Variables → Add variables:
   ```env
   MONGO_URL=<your-mongodb-atlas-connection-string>
   DB_NAME=collision_analysis_db
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C
   TWILIO_ACCOUNT_SID=<your-twilio-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-token>
   TWILIO_PHONE_NUMBER=<your-twilio-number>
   ```

4. **Configure Start Command**:
   - Settings → Deploy → Start Command:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

5. **Get Backend URL**:
   - Settings → Networking → Public domain
   - Example: `https://collision-backend.up.railway.app`

#### C. Deploy Frontend (Vercel)

1. **Deploy on Vercel**:
   - Go to https://vercel.com/
   - Sign in with GitHub
   - Click \"New Project\" → Import your repository
   - Configure:
     - Framework Preset: Create React App
     - Root Directory: `frontend`
     - Build Command: `yarn build`
     - Output Directory: `build`

2. **Add Environment Variable**:
   - Settings → Environment Variables:
   ```env
   REACT_APP_BACKEND_URL=https://collision-backend.up.railway.app
   ```

3. **Deploy**:
   - Click \"Deploy\"
   - Wait for build to complete
   - Your app will be live at: `https://your-app.vercel.app`

4. **Custom Domain** (Optional):
   - Settings → Domains
   - Add your domain
   - Configure DNS as instructed

## Option 3: Deploy to Single VPS (DigitalOcean/AWS)

### Prerequisites
- VPS with Ubuntu 22.04
- Domain name
- SSH access

### Quick Setup Script

1. **Connect to your VPS**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Run installation script**:
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   
   # Install Python
   apt install -y python3.11 python3.11-venv python3-pip
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
   echo \"deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse\" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   apt update
   apt install -y mongodb-org
   systemctl start mongod
   systemctl enable mongod
   
   # Install Nginx
   apt install -y nginx certbot python3-certbot-nginx
   
   # Clone your repository
   cd /var/www
   git clone https://github.com/yourusername/collision-analysis.git
   cd collision-analysis
   ```

3. **Configure Backend**:
   ```bash
   cd backend
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Create systemd service
   cat > /etc/systemd/system/collision-backend.service << EOF
   [Unit]
   Description=Collision Analysis Backend
   After=network.target
   
   [Service]
   User=www-data
   WorkingDirectory=/var/www/collision-analysis/backend
   ExecStart=/var/www/collision-analysis/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   systemctl enable collision-backend
   systemctl start collision-backend
   ```

4. **Configure Frontend**:
   ```bash
   cd /var/www/collision-analysis/frontend
   
   # Update .env
   echo \"REACT_APP_BACKEND_URL=https://yourdomain.com\" > .env
   
   # Build
   yarn install
   yarn build
   ```

5. **Configure Nginx**:
   ```bash
   cat > /etc/nginx/sites-available/collision-analysis << EOF
   server {
       listen 80;
       server_name yourdomain.com;
   
       # Frontend
       location / {
           root /var/www/collision-analysis/frontend/build;
           try_files \\$uri \\$uri/ /index.html;
       }
   
       # Backend API
       location /api {
           proxy_pass http://localhost:8001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \\$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \\$host;
           proxy_cache_bypass \\$http_upgrade;
       }
   }
   EOF
   
   ln -s /etc/nginx/sites-available/collision-analysis /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

6. **Setup SSL**:
   ```bash
   certbot --nginx -d yourdomain.com
   ```

## Option 4: Deploy with Docker

### Create Docker Configuration

1. **Backend Dockerfile** (`backend/Dockerfile`):
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   RUN apt-get update && apt-get install -y \\
       gcc \\
       && rm -rf /var/lib/apt/lists/*
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8001
   
   CMD [\"uvicorn\", \"server:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8001\"]
   ```

2. **Frontend Dockerfile** (`frontend/Dockerfile`):
   ```dockerfile
   FROM node:18-alpine as build
   
   WORKDIR /app
   
   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile
   
   COPY . .
   RUN yarn build
   
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   
   EXPOSE 80
   CMD [\"nginx\", \"-g\", \"daemon off;\"]
   ```

3. **Docker Compose** (`docker-compose.yml`):
   ```yaml
   version: '3.8'
   
   services:
     mongodb:
       image: mongo:6
       ports:
         - \"27017:27017\"
       volumes:
         - mongodb_data:/data/db
   
     backend:
       build: ./backend
       ports:
         - \"8001:8001\"
       environment:
         - MONGO_URL=mongodb://mongodb:27017
         - DB_NAME=collision_analysis_db
         - EMERGENT_LLM_KEY=sk-emergent-f2b0bB1A5FdBb02C2C
       depends_on:
         - mongodb
   
     frontend:
       build: ./frontend
       ports:
         - \"80:80\"
       environment:
         - REACT_APP_BACKEND_URL=http://localhost:8001
       depends_on:
         - backend
   
   volumes:
     mongodb_data:
   ```

4. **Deploy**:
   ```bash
   docker-compose up -d
   ```

## Post-Deployment Checklist

### Security
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set secure MongoDB passwords
- [ ] Enable CORS only for your domain
- [ ] Add rate limiting
- [ ] Set up authentication (if needed)

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation
- [ ] Configure alerts for system failures

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images and videos
- [ ] Set up database indexes

### Backup
- [ ] Configure automated database backups
- [ ] Set up disaster recovery plan
- [ ] Test restore procedures

## Cost Comparison

| Option | Monthly Cost | Setup Time | Scalability |
|--------|-------------|------------|-------------|
| Emergent | $0-50 | 0 min | Auto |
| Vercel + Railway | $0-20 | 30 min | Manual |
| VPS | $5-20 | 2 hours | Manual |
| Docker | $10-50 | 1 hour | Manual |

## Recommended Approach

1. **Development**: Use local VS Code setup
2. **Testing**: Use Emergent platform
3. **Production**: 
   - Small scale: Keep on Emergent
   - Medium scale: Vercel + Railway
   - Large scale: Dedicated VPS or cloud

## Getting a Custom Domain

### Purchase Domain
- Namecheap: https://www.namecheap.com
- Google Domains: https://domains.google
- GoDaddy: https://www.godaddy.com

### Configure DNS
For Vercel:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

For Emergent/Custom:
Follow instructions in your platform's custom domain settings.

## Support and Resources

- **Emergent Docs**: https://docs.emergent.sh
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

## Troubleshooting

### Common Issues

**CORS Error**:
- Update CORS_ORIGINS in backend .env
- Include your frontend domain

**Database Connection Failed**:
- Check MongoDB connection string
- Verify network access whitelist
- Confirm database user credentials

**Build Failed**:
- Check Node.js version (18+)
- Clear cache: `yarn cache clean`
- Delete node_modules and reinstall

**SSL Certificate Error**:
- Wait for DNS propagation (24-48 hours)
- Run certbot again
- Check domain configuration

---

**Need Help?** Contact support@emergent.sh or create an issue on GitHub!
