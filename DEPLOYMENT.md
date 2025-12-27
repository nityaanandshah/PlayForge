# Deployment Guide - ArenaMatch (PlayForge)

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker & Docker Compose installed
- Domain name configured (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Minimum 2GB RAM, 2 CPU cores, 20GB storage

## Deployment Options

### Option 1: Docker Compose (Recommended)

**1. Clone Repository**
```bash
git clone <your-repo-url>
cd ArenaMatch
```

**2. Configure Environment**
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Important:** Change these values:
- `JWT_SECRET` - Use a strong random string (32+ characters)
- `DATABASE_URL` - Update password
- `CORS_ORIGINS` - Your domain(s)

**3. Update docker-compose.yml for Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: playforge
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: playforge
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always

  api:
    build: .
    env_file: .env.production
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    restart: always

volumes:
  postgres_data:
  redis_data:
```

**4. Build and Deploy**
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

**5. Apply Database Migrations**
```bash
# Migrations are auto-applied on first run
# To manually apply new migrations:
docker exec -i arenamatch-postgres-1 psql -U playforge -d playforge < migrations/add_notifications.sql
```

**6. Verify Deployment**
```bash
# Health check
curl http://localhost:8080/health

# Should return: {"status":"ok","time":"..."}
```

---

### Option 2: Manual Deployment

**1. Install Go**
```bash
wget https://go.dev/dl/go1.21.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

**2. Install PostgreSQL & Redis**
```bash
# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server
```

**3. Configure Database**
```bash
sudo -u postgres psql
CREATE DATABASE playforge;
CREATE USER playforge WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE playforge TO playforge;
\q

# Apply migrations
psql -U playforge -d playforge < migrations/init.sql
psql -U playforge -d playforge < migrations/add_tournament_invitations.sql
psql -U playforge -d playforge < migrations/add_notifications.sql
```

**4. Build Backend**
```bash
cd /opt/arenamatch
go build -o main ./cmd/api
```

**5. Create Systemd Service**
```bash
sudo nano /etc/systemd/system/arenamatch.service
```

```ini
[Unit]
Description=ArenaMatch API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=arenamatch
WorkingDirectory=/opt/arenamatch
EnvironmentFile=/opt/arenamatch/.env.production
ExecStart=/opt/arenamatch/main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**6. Start Service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable arenamatch
sudo systemctl start arenamatch
sudo systemctl status arenamatch
```

**7. Build Frontend**
```bash
cd frontend
npm install
npm run build

# Serve with Nginx
sudo cp -r dist/* /var/www/html/
```

---

## SSL/HTTPS Setup (Nginx)

**1. Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

**2. Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/arenamatch
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

**3. Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/arenamatch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. Get SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database password
- [ ] Enable PostgreSQL SSL
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Enable log rotation
- [ ] Backup database regularly

### Firewall Setup
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Monitoring & Logging

### Check Logs
```bash
# Docker
docker-compose logs -f api

# Systemd
sudo journalctl -u arenamatch -f
```

### Database Backups
```bash
# Create backup script
sudo nano /opt/scripts/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Backup database
docker exec arenamatch-postgres-1 pg_dump -U playforge playforge | gzip > $BACKUP_DIR/playforge_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "playforge_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /opt/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /opt/scripts/backup-db.sh
```

---

## Performance Optimization

### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

```ini
# Connections
max_connections = 200

# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### Redis Tuning
```bash
sudo nano /etc/redis/redis.conf
```

```ini
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
sudo systemctl status arenamatch
sudo journalctl -u arenamatch -n 50

# Check ports
sudo netstat -tlnp | grep 8080

# Test database connection
psql -U playforge -d playforge -h localhost
```

### High Memory Usage
```bash
# Check processes
docker stats

# Restart services
docker-compose restart
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U playforge -d playforge -h localhost

# View active connections
SELECT * FROM pg_stat_activity;
```

---

## Rollback Procedure

**1. Stop Current Version**
```bash
docker-compose down
# or
sudo systemctl stop arenamatch
```

**2. Restore Database Backup**
```bash
gunzip < /opt/backups/playforge_YYYYMMDD_HHMMSS.sql.gz | docker exec -i arenamatch-postgres-1 psql -U playforge playforge
```

**3. Deploy Previous Version**
```bash
git checkout <previous-version-tag>
docker-compose up -d
```

---

## Update Procedure

**1. Backup Everything**
```bash
/opt/scripts/backup-db.sh
```

**2. Pull Latest Code**
```bash
git pull origin main
```

**3. Apply New Migrations**
```bash
docker exec -i arenamatch-postgres-1 psql -U playforge -d playforge < migrations/new_migration.sql
```

**4. Rebuild and Restart**
```bash
docker-compose build
docker-compose up -d
```

**5. Verify**
```bash
curl http://localhost:8080/health
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Logs configured
- [ ] Load testing performed
- [ ] Security audit passed
- [ ] Documentation updated

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor logs for errors
- Check service health
- Review performance metrics

**Weekly:**
- Review backup integrity
- Check disk space
- Update security patches

**Monthly:**
- Review and rotate logs
- Performance analysis
- Security audit

---

**Deployment Complete!** 🚀

Your ArenaMatch platform is now running in production.







