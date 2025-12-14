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
    "backend-go:dev",
    ".",
    dockerfile="Dockerfile",
    # Only rebuild when source files change (ignore frontend dirs and docs)
    ignore=["driver/", "customer/", "k8s/", "*.md", ".git/", ".vscode/", "node_modules/"],
)

k8s_yaml("k8s/app.yaml")
k8s_yaml("k8s/redis.yaml")
k8s_yaml("k8s/rabbitmq.yaml")
k8s_yaml("k8s/minio.yaml")
k8s_yaml("k8s/secrets.yaml")
k8s_yaml("k8s/hpa.yaml")
k8s_yaml("k8s/worker.yaml")

# Helm: Local HA Postgres (Complex Config)
# We generate YAMLs via 'helm template' and feed them to Tilt.
# This gives Tilt full visibility and control over the Pods/Services.
postgres_yaml = local(".\\deps\\windows-amd64\\helm.exe template postgres bitnami/postgresql -f k8s/db/values.yaml --set pgbouncer.enabled=true")
k8s_yaml(postgres_yaml)

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
        "admin-dashboard:dev",
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
