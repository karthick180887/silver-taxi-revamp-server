# 🚀 Silver Taxi Server - Quick Deployment Commands

> **Complete command reference for building, pushing, and deploying the server**

---

## 📋 Table of Contents

1. [Build Docker Image](#1-build-docker-image)
2. [Tag Image for Registry](#2-tag-image-for-registry)
3. [Login to Registry](#3-login-to-registry)
4. [Push Image to Registry](#4-push-image-to-registry)
5. [Restart Deployments](#5-restart-deployments)
6. [Complete Deployment Script](#6-complete-deployment-script)
7. [Quick Reference](#7-quick-reference)

---

## 1. Build Docker Image

```powershell
# Build the Docker image
docker build -t silver-taxi-server:latest .

# Verify the image was built
docker images | Select-String "silver-taxi-server"
```

**Expected Output:**
```
silver-taxi-server   latest   <image-id>   <size>   <time>
```

---

## 2. Tag Image for Registry

```powershell
# Tag image for DigitalOcean Container Registry
docker tag silver-taxi-server:latest registry.digitalocean.com/silver-taxi/silver-taxi-server:latest

# Verify tagged image
docker images | Select-String "registry.digitalocean.com/silver-taxi"
```

**Expected Output:**
```
registry.digitalocean.com/silver-taxi/silver-taxi-server   latest   <image-id>   <size>   <time>
```

---

## 3. Login to Registry

```powershell
# Login to DigitalOcean Container Registry
doctl registry login
```

**Note:** Login is valid for 30 days.

---

## 4. Push Image to Registry

```powershell
# Push the image to DigitalOcean Container Registry
docker push registry.digitalocean.com/silver-taxi/silver-taxi-server:latest

# Verify image in registry
doctl registry repository list-tags silver-taxi-server
```

**Expected Output:**
```
Tag     Manifest                              Updated At
latest  sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxx   2024-XX-XX XX:XX:XX +0000 UTC
```

---

## 5. Restart Deployments

### 5.1 Restart Server Deployment

```powershell
# Restart the main server deployment
kubectl rollout restart deployment/silver-taxi-server

# Wait for rollout to complete
kubectl rollout status deployment/silver-taxi-server --timeout=120s

# Verify pod status
kubectl get pods -l app=silver-taxi-server
```

### 5.2 Restart Queue Worker Deployment

```powershell
# Restart the queue worker deployment
kubectl rollout restart deployment/silver-taxi-queue

# Wait for rollout to complete
kubectl rollout status deployment/silver-taxi-queue --timeout=120s

# Verify pod status
kubectl get pods -l app=silver-taxi-queue
```

### 5.3 Restart Cron Server Deployment

```powershell
# Restart the cron server deployment
kubectl rollout restart deployment/silver-taxi-cron

# Wait for rollout to complete
kubectl rollout status deployment/silver-taxi-cron --timeout=120s

# Verify pod status
kubectl get pods -l app=silver-taxi-cron
```

### 5.4 Restart All Deployments

```powershell
# Restart all Silver Taxi deployments
kubectl rollout restart deployment/silver-taxi-server
kubectl rollout restart deployment/silver-taxi-queue
kubectl rollout restart deployment/silver-taxi-cron

# Wait for all rollouts
kubectl rollout status deployment/silver-taxi-server --timeout=120s
kubectl rollout status deployment/silver-taxi-queue --timeout=120s
kubectl rollout status deployment/silver-taxi-cron --timeout=120s

# Check all pod statuses
kubectl get pods -l 'app in (silver-taxi-server,silver-taxi-queue,silver-taxi-cron)'
```

---

## 6. Complete Deployment Script

### Full Deployment (Build → Push → Restart)

```powershell
# Complete deployment script - Build, Push, and Restart

Write-Host "🚀 Starting Silver Taxi Server Deployment..." -ForegroundColor Green

# Step 1: Build Docker Image
Write-Host "`n📦 Step 1: Building Docker image..." -ForegroundColor Yellow
docker build -t silver-taxi-server:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Tag for DCR
Write-Host "`n🏷️  Step 2: Tagging image for DCR..." -ForegroundColor Yellow
docker tag silver-taxi-server:latest registry.digitalocean.com/silver-taxi/silver-taxi-server:latest

# Step 3: Login to DCR
Write-Host "`n🔐 Step 3: Logging in to DigitalOcean Container Registry..." -ForegroundColor Yellow
doctl registry login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Registry login failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Push Image
Write-Host "`n⬆️  Step 4: Pushing image to DCR..." -ForegroundColor Yellow
docker push registry.digitalocean.com/silver-taxi/silver-taxi-server:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Restart Server Deployment
Write-Host "`n🔄 Step 5: Restarting server deployment..." -ForegroundColor Yellow
kubectl rollout restart deployment/silver-taxi-server
kubectl rollout status deployment/silver-taxi-server --timeout=120s

# Step 6: Show Status
Write-Host "`n✅ Deployment complete! Status:" -ForegroundColor Green
kubectl get pods -l app=silver-taxi-server

Write-Host "`n🎉 Deployment successful!" -ForegroundColor Green
```

---

## 7. Quick Reference

### One-Line Commands

#### Build and Tag
```powershell
docker build -t silver-taxi-server:latest . && docker tag silver-taxi-server:latest registry.digitalocean.com/silver-taxi/silver-taxi-server:latest
```

#### Build, Tag, Login, and Push
```powershell
docker build -t silver-taxi-server:latest . && docker tag silver-taxi-server:latest registry.digitalocean.com/silver-taxi/silver-taxi-server:latest && doctl registry login && docker push registry.digitalocean.com/silver-taxi/silver-taxi-server:latest
```

#### Full Deployment (Build → Push → Restart)
```powershell
docker build -t silver-taxi-server:latest . && docker tag silver-taxi-server:latest registry.digitalocean.com/silver-taxi/silver-taxi-server:latest && doctl registry login && docker push registry.digitalocean.com/silver-taxi/silver-taxi-server:latest && kubectl rollout restart deployment/silver-taxi-server && kubectl rollout status deployment/silver-taxi-server --timeout=120s
```

---

## 🔍 Verification Commands

### Check Docker Images
```powershell
# List all silver-taxi images
docker images | Select-String "silver-taxi-server"

# List registry images
docker images | Select-String "registry.digitalocean.com"
```

### Check Registry
```powershell
# List tags in registry
doctl registry repository list-tags silver-taxi-server

# List all repositories
doctl registry repository list
```

### Check Kubernetes Deployments
```powershell
# Check all deployments
kubectl get deployments

# Check all pods
kubectl get pods

# Check specific app pods
kubectl get pods -l app=silver-taxi-server
kubectl get pods -l app=silver-taxi-queue
kubectl get pods -l app=silver-taxi-cron
```

### Check Logs
```powershell
# Server logs
kubectl logs -l app=silver-taxi-server --tail=50

# Queue worker logs
kubectl logs -l app=silver-taxi-queue --tail=50

# Cron server logs
kubectl logs -l app=silver-taxi-cron --tail=50

# Follow logs (live)
kubectl logs -f -l app=silver-taxi-server
```

### Check RabbitMQ Connection
```powershell
# Check for RabbitMQ connection in logs
kubectl logs -l app=silver-taxi-server | Select-String -Pattern "RabbitMQ"

# Check RabbitMQ pod
kubectl get pods -l app=rabbitmq
kubectl logs -l app=rabbitmq --tail=20
```

---

## 🛠️ Troubleshooting

### If Build Fails
```powershell
# Check Docker is running
docker ps

# Check Dockerfile exists
Get-ChildItem Dockerfile

# Clean build (no cache)
docker build --no-cache -t silver-taxi-server:latest .
```

### If Push Fails
```powershell
# Re-authenticate
doctl registry login

# Check network connectivity
Test-NetConnection registry.digitalocean.com -Port 443

# Verify image exists
docker images | Select-String "silver-taxi-server"
```

### If Deployment Fails
```powershell
# Check pod status
kubectl get pods -l app=silver-taxi-server

# Check pod events
kubectl describe pod -l app=silver-taxi-server

# Check pod logs
kubectl logs -l app=silver-taxi-server --tail=100

# Check deployment status
kubectl rollout status deployment/silver-taxi-server

# View deployment history
kubectl rollout history deployment/silver-taxi-server

# Rollback if needed
kubectl rollout undo deployment/silver-taxi-server
```

### If Image Pull Fails
```powershell
# Check registry secret exists
kubectl get secret registry-silver-taxi

# Recreate registry secret if needed
doctl registry login
kubectl create secret generic registry-silver-taxi `
    --from-file=.dockerconfigjson="$env:USERPROFILE\.docker\config.json" `
    --type=kubernetes.io/dockerconfigjson `
    --dry-run=client -o yaml | kubectl apply -f -
```

---

## 📝 Notes

- **Registry URL:** `registry.digitalocean.com/silver-taxi/silver-taxi-server:latest`
- **Login Duration:** 30 days (or use `--never-expire` flag)
- **Deployment Timeout:** 120 seconds (adjust as needed)
- **Image Tag:** Always using `latest` tag for simplicity

---

## 🔗 Related Files

- `Dockerfile` - Docker image build configuration
- `k8s-deploy.yaml` - Kubernetes deployment configuration
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `CONNECTION_DETAILS.md` - Service connection details

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

