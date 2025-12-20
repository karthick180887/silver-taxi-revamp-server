# Kubernetes Connection Stability Fixes

## Problem
TCP connections between local machine and DigitalOcean K8s cluster drop due to:
- NAT/router timeout (usually 5-10 minutes of idle)
- ISP connection resets
- Firewall idle connection cleanup

## Solutions Applied

### 1. SSH Config Keepalive (if using SSH tunnel)
Add to `~/.ssh/config`:
```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 2. kubectl Keepalive
Set environment variable:
```powershell
$env:KUBECTL_EXEC_TIMEOUT = "0"
```

### 3. Windows TCP Keepalive Registry Fix
Run as Admin:
```powershell
# Set TCP keepalive to 60 seconds (default is 2 hours!)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "KeepAliveTime" -Value 60000 -Type DWord

# Set keepalive interval to 1 second
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "KeepAliveInterval" -Value 1000 -Type DWord
```
**Requires restart to take effect**

### 4. Tilt with Auto-Reconnect
Tilt should auto-reconnect, but if issues persist, restart tilt:
```powershell
tilt down; tilt up
```

### 5. Use a Persistent Terminal Multiplexer
Consider using Windows Terminal with multiple tabs to quickly recover from drops.

## Recommended: Direct API Access
Instead of relying on port-forwarding, access services via their LoadBalancer IPs or Ingress URLs which are more stable.
