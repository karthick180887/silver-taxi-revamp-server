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

# Port-forward: 30060->8081 (for Flutter/Ext), 8081->8081 (for Dashboard)
k8s_resource("backend-go-app", port_forwards=[
    port_forward(30060, 8081, host="0.0.0.0"),
    port_forward(8081, 8081, host="0.0.0.0")
])
k8s_resource("redis")

# Admin Dashboard
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
