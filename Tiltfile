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

# Port-forward the app service so you can hit http://192.168.1.100:30060 during tilt up
k8s_resource("backend-go-app", port_forwards=port_forward(30060, 3060, host="0.0.0.0"))
k8s_resource("redis")

