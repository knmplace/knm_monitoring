# KNM Monitoring Dashboard - Deployment Summary

## ✅ Deployment Complete

The KNM Monitoring Dashboard has been successfully deployed and is now running!

### 🌐 Access Information

- **Local URL:** http://localhost:5005
- **Domain (to configure):** https://knmmonitoring.nikodamas.org
- **PM2 Process Name:** knm-monitoring

### 📊 Current Status

```
PM2 Processes:
├── apps-dev (demosite) - Port 3000 - ✅ Online
└── knm-monitoring - Port 5005 - ✅ Online

Systemd Services:
└── webhook - Port 9000 - ✅ Active
```

### 🔐 Login Credentials

Use your existing Firebase admin credentials from the demosite project:
- Same email/password as the main KNM Place application
- Only users with `role: 'admin'` can access the dashboard

### 📁 Project Structure

```
/home/apps/monitoring/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main dashboard (project overview)
│   ├── login/page.tsx     # Login page
│   ├── projects/[id]/     # Project detail pages
│   └── api/               # API routes
├── components/            # React components
│   ├── AuthProvider.tsx   # Authentication context
│   ├── AuthGate.tsx       # Admin access control
│   ├── ProjectCard.tsx    # Project overview card
│   ├── ProcessTable.tsx   # PM2 process table
│   └── StatusBadge.tsx    # Status indicators
├── lib/                   # Utilities
│   ├── firebase-client.ts # Firebase client SDK
│   ├── firebase-admin.ts  # Firebase admin SDK
│   ├── auth-middleware.ts # API authentication
│   └── system-commands.ts # System command execution
├── config/
│   └── projects.ts        # Project registry
├── logs/                  # Application logs
│   └── audit.log          # Admin action audit log
├── ecosystem.config.js    # PM2 configuration
└── .env.local            # Environment variables (not in git)
```

### 🎯 Features Available

**Dashboard (/):**
- View all configured projects
- See overall system status
- Quick navigation to project details
- Auto-refresh every 10 seconds

**Project Detail (/projects/[id]):**
- PM2 process status and control
- Restart/stop/start processes
- View system metrics (CPU, memory, disk)
- Health check status
- Real-time updates

**API Endpoints:**
- `/api/projects` - List all projects
- `/api/projects/[id]/pm2/status` - PM2 process status
- `/api/projects/[id]/pm2/{restart|stop|start}` - Process control
- `/api/projects/[id]/pm2/logs` - PM2 logs
- `/api/projects/[id]/service/status` - systemd service status
- `/api/projects/[id]/service/restart` - Restart service
- `/api/projects/[id]/service/logs` - Service logs
- `/api/projects/[id]/metrics` - System metrics
- `/api/projects/[id]/health` - Health check
- `/api/system/overview` - All projects overview

### 🔧 Management Commands

**PM2 Commands:**
```bash
# View status
pm2 list

# View logs
pm2 logs knm-monitoring

# Restart
pm2 restart knm-monitoring

# Stop
pm2 stop knm-monitoring

# Start
pm2 start knm-monitoring
```

**Application Commands:**
```bash
# Navigate to project
cd /home/apps/monitoring

# Rebuild after changes
npm run build

# Restart PM2 process after rebuild
pm2 restart knm-monitoring
```

### 📝 Adding New Projects to Monitor

Edit `/home/apps/monitoring/config/projects.ts`:

```typescript
export const projects: Project[] = [
  {
    id: 'demosite',
    name: 'KNM Place Community Apps',
    description: 'Main community management application',
    pm2Processes: ['apps-dev'],
    systemdServices: ['webhook'],
    ports: [3000, 9000],
    logPaths: {
      pm2: '/home/apps/demosite/logs',
      deployment: '/home/apps/demosite/logs/deployment.log',
      webhook: '/home/apps/demosite/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:9000/health',
  },
  // Add new projects here
  {
    id: 'new-project',
    name: 'New Project Name',
    description: 'Project description',
    pm2Processes: ['process-name'],
    systemdServices: ['service-name'],
    ports: [4000],
    logPaths: {
      pm2: '/home/apps/new-project/logs',
      deployment: '/home/apps/new-project/logs/deployment.log',
      webhook: '/home/apps/new-project/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:4000/health',
  },
];
```

After adding a project:
```bash
cd /home/apps/monitoring
npm run build
pm2 restart knm-monitoring
```

### 🔒 Security Features

1. **Authentication Required:**
   - All pages require Firebase authentication
   - API routes verify Firebase ID tokens
   - Admin role required for access

2. **Command Safety:**
   - Whitelisted commands only
   - Input sanitization
   - No arbitrary command execution

3. **Audit Logging:**
   - All administrative actions logged
   - Location: `/home/apps/monitoring/logs/audit.log`
   - Includes: timestamp, user email, action, details

4. **Access Control:**
   - Only users with `role: 'admin'` in Firestore
   - Non-admin users see "Access Denied" page

### 🌐 Next Step: Configure Domain

To access via https://knmmonitoring.nikodamas.org:

1. Open Nginx Proxy Manager (usually at your server IP:81)
2. Add Proxy Host:
   - **Domain Names:** knmmonitoring.nikodamas.org
   - **Scheme:** http
   - **Forward Hostname/IP:** localhost
   - **Forward Port:** 5005
   - **Block Common Exploits:** ✅ On
   - **Websockets Support:** ✅ On
3. SSL Tab:
   - **SSL Certificate:** Request a new SSL certificate
   - **Force SSL:** ✅ On
   - **HTTP/2 Support:** ✅ On

### 📊 Monitoring the Monitoring App

The monitoring app itself can be monitored:
- PM2 process: `pm2 list` shows status
- Logs: `pm2 logs knm-monitoring`
- Memory: Set to auto-restart if exceeds 500MB
- Health: Access http://localhost:5005 to verify

### 🔄 Auto-start on Server Reboot

Already configured! The monitoring app will auto-start on reboot:
- PM2 is configured with `pm2 startup` (previously set up)
- Process list saved with `pm2 save`
- Both apps-dev and knm-monitoring will start automatically

### 📖 Additional Documentation

- **Firebase Admin Setup:** See `setup-firebase-admin.md`
- **Environment Variables:** See `.env.example`
- **API Documentation:** See individual route files in `app/api/`

---

## 🎉 Success!

Your KNM Monitoring Dashboard is now live and monitoring your projects. Access it at http://localhost:5005 (or configure the domain for external access).

**What you can do now:**
1. ✅ Login with your admin credentials
2. ✅ View the demosite project status
3. ✅ Control PM2 processes (restart/stop/start)
4. ✅ Monitor system metrics in real-time
5. ✅ Add more projects to the configuration

**Production URL Setup:**
- Configure Nginx Proxy Manager to point knmmonitoring.nikodamas.org to port 5005
- SSL certificate will be automatically provisioned

---

*Generated: 2026-01-20*
*KNM Monitoring Dashboard v1.0*
