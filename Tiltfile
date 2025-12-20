allow_k8s_contexts('do-blr1-k8s-1-34-1-do-1-blr1-1765796098736')
update_settings(suppress_unused_image_warnings=["admin-dashboard:dev"])
default_registry('registry.digitalocean.com/cabigo')
# Config: mode (default: all)
# Options: 
#   - core: Backend + DBs only
#   - admin: Backend + Admin Dashboard
#   - all: Everything
config.define_string("mode")
cfg = config.parse()
mode = cfg.get("mode", "all")

# Enable Docker BuildKit for better caching
# Tilt automatically uses BuildKit cache mounts from Dockerfile
docker_build(
    "backend-ts:dev",
    ".",
    dockerfile="Dockerfile",
    # Only rebuild when source files change (ignore frontend dirs and docs)
    ignore=["driver/", "customer/", "vendor/", "admin-dashboard/", "k8s/", "*.md", ".git/", ".vscode/", "node_modules/"],
)

k8s_yaml("k8s/app.yaml")
k8s_yaml("k8s/redis.yaml")
k8s_yaml("k8s/rabbitmq.yaml")
k8s_yaml("k8s/minio.yaml")
k8s_yaml("k8s/secrets.yaml")
k8s_yaml("k8s/hpa.yaml")
k8s_yaml("k8s/worker.yaml")

# Helm: Ingress Nginx
local(".\\deps\\windows-amd64\\helm.exe repo add ingress-nginx https://kubernetes.github.io/ingress-nginx")
ingress_yaml = local(".\\deps\\windows-amd64\\helm.exe template ingress-nginx ingress-nginx/ingress-nginx --version 4.10.0 --set controller.service.type=LoadBalancer --set controller.admissionWebhooks.enabled=false")
k8s_yaml(ingress_yaml)

# Helm: Cert Manager
local(".\\deps\\windows-amd64\\helm.exe repo add jetstack https://charts.jetstack.io")
# Cert Manager needs CRDs. We use a separate kubectl apply for CRDs usually, but helm template has --include-crds (v3.5+) or we rely on the chart.
# Setup namespace first
local("kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -")

# Apply CRDs explicitly to avoid huge YAML strings causing "filename too long" errors
k8s_yaml("k8s/cert-manager-crds.yaml")

# Generate and filter Cert-Manager YAML using external script to avoid Tilt/Windows header limit issues
# Ensure any existing webhooks are deleted first to avoid stale config causing failures
local("kubectl delete validatingwebhookconfiguration cert-manager-webhook --ignore-not-found")
local("kubectl delete mutatingwebhookconfiguration cert-manager-webhook --ignore-not-found")
local("python scripts/generate_cert_manager.py")
k8s_yaml("k8s/cert-manager-filtered.yaml")

# Apply Ingress and Issuer Configs
k8s_yaml("k8s/ingress.yaml")
k8s_yaml("k8s/issuer.yaml")

# Helm: Local HA Postgres (Complex Config)
# We generate YAMLs via 'helm template' and feed them to Tilt.
# This gives Tilt full visibility and control over the Pods/Services.
postgres_yaml = local(".\\deps\\windows-amd64\\helm.exe template postgres bitnami/postgresql -f k8s/db/values.yaml")
watch_file("k8s/db/values.yaml")
# Force reload 4
k8s_yaml(postgres_yaml)
k8s_yaml('k8s/pgbouncer.yaml')

# Now we can explicitly track the workloads because Tilt knows about the YAML
k8s_resource(
    workload="postgres-postgresql-primary", 
    labels=["db"],
    port_forwards=[port_forward(5433, 5432)]
)
k8s_resource(workload="postgres-postgresql-read", labels=["db"])


# Port-forward: 30060->8081 (for Flutter/Ext), 8081->8081 (for Dashboard)
k8s_resource("backend-go-app", port_forwards=[
    port_forward(30060, 8081, host="0.0.0.0"),
    port_forward(8081, 8081, host="0.0.0.0")
])
k8s_resource("redis")

# Admin Dashboard - Only load if mode is 'admin' or 'all'
if mode == "admin" or mode == "all":
    print("Loading Admin Dashboard...")
    docker_build(
        "registry.digitalocean.com/cabigo/admin-dashboard:latest",
        "admin-dashboard",
        dockerfile="admin-dashboard/Dockerfile",
        ignore=["node_modules/", ".next/", ".git/"],
    )
    k8s_yaml("k8s/admin-dashboard.yaml")
    k8s_resource("admin-dashboard", port_forwards=[
        port_forward(3000, 3000, host="0.0.0.0")
    ])
else:
    print("Skipping Admin Dashboard (Mode: {})".format(mode))

# Cabigo Website - Public marketing website
if mode == "admin" or mode == "all":
    print("Loading Cabigo Website...")
    docker_build(
        "registry.digitalocean.com/cabigo/cabigo-website:latest",
        "cabigo",
        dockerfile="cabigo/Dockerfile",
        ignore=["node_modules/", ".next/", ".git/"],
    )
    k8s_yaml("k8s/cabigo-website.yaml")
    k8s_resource("cabigo-website", labels=["frontend"])
else:
    print("Skipping Cabigo Website (Mode: {})".format(mode))
