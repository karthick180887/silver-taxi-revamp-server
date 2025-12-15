import subprocess
import os
import sys

def main():
    # Define paths
    # Assuming running from project root
    helm_path = os.path.join(".", "deps", "windows-amd64", "helm.exe")
    output_file = os.path.join("k8s", "cert-manager-filtered.yaml")
    
    print(f"Generating Cert Manager YAML...")
    print(f"Helm Path: {helm_path}")

    # Helm command
    # Exclude CRDs because we apply them separately to avoid "filename too long" issues
    cmd = [
        helm_path, 
        "template", 
        "cert-manager", 
        "jetstack/cert-manager",
        "--version", "v1.14.4",
        "--namespace", "cert-manager",
        "--set", "webhook.enabled=false",
        "--set", "startupapicheck.enabled=false"
    ]
    
    try:
        # Run helm
        # encoding='utf-8' to ensure we handle chars correctly
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, encoding='utf-8')
        yaml_content = result.stdout
        
        # Filter logic
        documents = yaml_content.split("\n---")
        filtered_docs = []
        removed_count = 0
        
        for doc in documents:
            # Skip empty docs
            if not doc.strip():
                continue

            # Aggressive filtering of anything related to the webhook
            # This matches names and kinds to be absolutely sure
            if "cert-manager-webhook" in doc:
                 # Check specific kinds to be surgical but consistent
                 if "kind: Deployment" in doc:
                     removed_count += 1
                     continue
                 if "kind: Service" in doc and "kind: ServiceAccount" not in doc: # ServiceAccount also has this string, handled below
                     removed_count += 1
                     continue
                 if "kind: ServiceAccount" in doc:
                     removed_count += 1
                     continue
                 if "kind: ClusterRole" in doc:
                     removed_count += 1
                     continue
                 if "kind: ClusterRoleBinding" in doc:
                     removed_count += 1
                     continue
                 if "kind: Role" in doc:
                     removed_count += 1
                     continue
                 if "kind: RoleBinding" in doc:
                     removed_count += 1
                     continue

            # Always remove the actual webhook configurations regardless of name match
            if "kind: ValidatingWebhookConfiguration" in doc:
                removed_count += 1
                continue
            if "kind: MutatingWebhookConfiguration" in doc:
                removed_count += 1
                continue
            
            filtered_docs.append(doc)
            
        final_yaml = "\n---".join(filtered_docs)
        
        # Write to file only if changed (Idempotency to prevent Tilt loops)
        should_write = True
        if os.path.exists(output_file):
            with open(output_file, "r", encoding="utf-8") as f:
                if f.read() == final_yaml:
                    should_write = False
                    print("YAML content unchanged, skipping write.")
        
        if should_write:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(final_yaml)
                print(f"Successfully generated {output_file}")
        else:
             print(f"Skipped writing {output_file} (Up to date)")
        print(f"Removed {removed_count} webhook configurations.")
        
    except subprocess.CalledProcessError as e:
        print("Error running Helm:")
        print(e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
