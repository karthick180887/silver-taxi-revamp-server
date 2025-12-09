# 🔌 Silver Taxi Kubernetes - Connection Details

> **Complete connection details for all services with external IPs**  
> Last Updated: 2025-11-03 18:15:45

---

## 📊 External IPs - All Services

| Service | External IP | Port(s) | Status |
|---------|-------------|----------|--------|
| **Postgres** | `174.138.120.72` | `5432` | ✅ Running |
| **RabbitMQ** | `139.59.52.196` | `5672` (AMQP), `15672` (Management UI) | ✅ Running |
| **MinIO** | `68.183.246.42` | `9000` (API), `9001` (Console) | ✅ Running |
| **Silver Taxi Server** | `64.225.85.10` | `80` | ✅ Running |
| **Nginx Proxy Manager** | `68.183.246.159` | `80` (HTTP), `81` (Admin), `443` (HTTPS) | ✅ Running |

---

## 🔐 Detailed Connection Information

### 1. PostgreSQL Database

**External Connection:**
- **Host:** `174.138.120.72`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgres`
- **Password:** `xWJY+TyA0cj4a6wUqxg=`

**Connection String:**
```
postgresql://postgres:xWJY+TyA0cj4a6wUqxg=@174.138.120.72:5432/postgres
```

**Internal (within Kubernetes):**
- **Host:** `postgres`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgres`
- **Password:** `xWJY+TyA0cj4a6wUqxg=`

**Test Connection:**
```powershell
# Using psql
psql -h 174.138.120.72 -p 5432 -U postgres -d postgres

# Using pgAdmin or DBeaver
# Create new connection with above credentials
```

---

### 2. RabbitMQ Message Broker

**AMQP Connection:**
- **Host:** `139.59.52.196`
- **Port:** `5672`
- **Username:** `admin`
- **Password:** `silver-admin@rabbit`
- **Virtual Host:** `/` (default)

**Connection URL:**
```
amqp://admin:silver-admin%40rabbit@139.59.52.196:5672/
```

**Management UI:**
- **URL:** `http://139.59.52.196:15672`
- **Username:** `admin`
- **Password:** `silver-admin@rabbit`

**Internal (within Kubernetes):**
- **Host:** `rabbitmq`
- **Port:** `5672`
- **Management UI Port:** `15672`

**Test Connection:**
```powershell
# Access Management UI in browser
Start-Process "http://139.59.52.196:15672"
```

---

### 3. MinIO Object Storage

**API Endpoint:**
- **Host:** `68.183.246.42`
- **Port:** `9000`
- **Access Key:** `admin`
- **Secret Key:** `siLver123@T`
- **Region:** `us-east-1` (default)

**Console UI:**
- **URL:** `http://68.183.246.42:9001`
- **Username:** `admin`
- **Password:** `siLver123@T`

**Bucket:**
- **Bucket Name:** `silver-taxi-images`

**Connection String:**
```
s3://admin:siLver123@T@68.183.246.42:9000/silver-taxi-images
```

**Internal (within Kubernetes):**
- **Host:** `minio`
- **Port:** `9000`
- **Console Port:** `9001`

**Test Connection:**
```powershell
# Access Console UI in browser
Start-Process "http://68.183.246.42:9001"

# Using AWS CLI (configured for MinIO)
aws --endpoint-url http://68.183.246.42:9000 s3 ls
```

**MinIO Client Configuration:**
```bash
mc alias set minio http://68.183.246.42:9000 admin siLver123@T
mc ls minio/silver-taxi-images
```

---

### 4. Silver Taxi API Server

**API Endpoint:**
- **URL:** `http://64.225.85.10`
- **Port:** `80`

**Base URL:**
- **Production:** `https://api.silvertaxi.in`
- **Direct IP:** `http://64.225.85.10`

**Environment:**
- **NODE_ENV:** `production`
- **PORT:** `3011` (internal)

**Test Connection:**
```powershell
# Health check
Invoke-WebRequest -Uri "http://64.225.85.10/health" -Method GET

# API endpoint
Invoke-WebRequest -Uri "http://64.225.85.10/api/v1/status" -Method GET
```

**Internal (within Kubernetes):**
- **Service Name:** `silver-taxi-service`
- **Port:** `80`

---

### 5. Nginx Proxy Manager

**HTTP Access:**
- **URL:** `http://68.183.246.159`
- **Port:** `80`

**HTTPS Access:**
- **URL:** `https://68.183.246.159`
- **Port:** `443`

**Admin Panel:**
- **URL:** `http://68.183.246.159:81`
- **Default Email:** `admin@example.com`
- **Default Password:** `changeme` (⚠️ Change immediately!)

**Test Connection:**
```powershell
# Access Admin Panel
Start-Process "http://68.183.246.159:81"
```

---

### 6. Redis (External)

**Note:** Redis is running externally, not in Kubernetes.

- **Host:** `192.168.0.141`
- **Port:** `7004`
- **Password:** `z8F64jCiVDCmN5WrlrRKhgHccpZ3tpphcc58cUnq2l73Tqhzbt`
- **UI Port:** `5540`

**Connection String:**
```
redis://:z8F64jCiVDCmN5WrlrRKhgHccpZ3tpphcc58cUnq2l73Tqhzbt@192.168.0.141:7004
```

**Redis UI:**
- **URL:** `http://192.168.0.141:5540`

---

## 🔄 Quick Reference

### All External IPs at a Glance

```


Postgres:         174.138.120.72:5432
RabbitMQ AMQP:    139.59.52.196:5672
RabbitMQ UI:      http://139.59.52.196:15672
MinIO API:        68.183.246.42:9000
MinIO Console:    http://68.183.246.42:9001
Silver Taxi API:  http://64.225.85.10
Nginx Proxy:      http://68.183.246.159
Nginx Admin:      http://68.183.246.159:81
Redis:            192.168.0.141:7004
```

---

## 📝 Internal Service Names (for Kubernetes pod connections)

When connecting from within the Kubernetes cluster:

- **Postgres:** `postgres:5432`
- **RabbitMQ:** `rabbitmq:5672`
- **MinIO:** `minio:9000`
- **Silver Taxi Server:** `silver-taxi-service:80`
- **Nginx Proxy Manager:** `nginx-proxy-manager:80`

---

## 🔍 Verification Commands

### Check All Services Status
```powershell
kubectl get services -o wide
kubectl get pods
```

### Check Specific Service IP
```powershell
kubectl get service <service-name> -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Example:
```powershell
kubectl get service postgres -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
# Output: 174.138.120.72
```

---

## 🔐 Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Passwords:**
   - Nginx Proxy Manager default credentials
   - Postgres password (if needed)

2. **Firewall Rules:**
   - Configure firewall rules to restrict access if needed
   - Consider using whitelist IPs for database connections

3. **SSL/TLS:**
   - Set up SSL certificates via Nginx Proxy Manager
   - Use HTTPS for production APIs

4. **Access Control:**
   - Limit external database access
   - Use strong passwords for all services

---

## 📞 Support

For connection issues:
1. Verify service is running: `kubectl get pods`
2. Check service logs: `kubectl logs <pod-name>`
3. Verify external IP: `kubectl get service <service-name>`
4. Test connectivity: `telnet <external-ip> <port>`

---




Proxy:
IP:-http://68.183.246.159:81
Username:-silvertaxi@gmail.com
Password:-silvertaxi

