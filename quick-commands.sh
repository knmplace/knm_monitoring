#!/bin/bash
# Quick Commands for KNM Monitoring Dashboard

echo "==================================="
echo "KNM Monitoring Dashboard - Quick Commands"
echo "==================================="
echo ""

case "$1" in
  status)
    echo "📊 Current Status:"
    pm2 list
    echo ""
    echo "Webhook Service:"
    systemctl status webhook --no-pager | head -5
    ;;

  logs)
    echo "📝 Viewing monitoring app logs (Ctrl+C to exit):"
    pm2 logs knm-monitoring
    ;;

  restart)
    echo "🔄 Restarting monitoring app..."
    pm2 restart knm-monitoring
    echo "✅ Restarted!"
    ;;

  rebuild)
    echo "🔨 Rebuilding and restarting..."
    cd /home/apps/monitoring
    npm run build
    pm2 restart knm-monitoring
    echo "✅ Rebuild complete!"
    ;;

  test)
    echo "🧪 Testing monitoring app..."
    echo "Local URL test:"
    curl -s http://localhost:5005/login | grep -o "<title>[^<]*</title>"
    echo ""
    echo "PM2 Status:"
    pm2 list | grep -E "(knm-monitoring|apps-dev)"
    ;;

  url)
    echo "🌐 Access URLs:"
    echo "  Local:  http://localhost:5005"
    echo "  Domain: https://knmmonitoring.nikodamas.org (configure in Nginx Proxy Manager)"
    echo ""
    echo "Login with your admin Firebase credentials"
    ;;

  add-project)
    echo "📝 To add a new project to monitor:"
    echo "1. Edit: /home/apps/monitoring/config/projects.ts"
    echo "2. Add your project configuration"
    echo "3. Run: ./quick-commands.sh rebuild"
    ;;

  *)
    echo "Usage: ./quick-commands.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  status      - Show PM2 and service status"
    echo "  logs        - View monitoring app logs"
    echo "  restart     - Restart monitoring app"
    echo "  rebuild     - Rebuild and restart after code changes"
    echo "  test        - Test if monitoring app is working"
    echo "  url         - Show access URLs"
    echo "  add-project - Instructions for adding new projects"
    echo ""
    echo "Examples:"
    echo "  ./quick-commands.sh status"
    echo "  ./quick-commands.sh logs"
    ;;
esac
