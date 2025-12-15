
import subprocess
import time

def run_psql_command(command):
    pod_name = "postgres-postgresql-primary-0"
    full_cmd = f"kubectl exec -i {pod_name} -- env PGPASSWORD=taxi_password psql -U taxi_user -d defaultdb -t -c \"{command}\""
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip().split('\n')

def drop_indices(table_name):
    print(f"Fetching indices for {table_name}...")
    indices = run_psql_command(f"SELECT indexname FROM pg_indexes WHERE tablename = '{table_name}' AND indexname NOT LIKE '%pkey'")
    
    count = 0
    for index in indices:
        index = index.strip()
        if not index: continue
        print(f"Dropping index: {index}")
        # Use double quotes for index name to handle special characters
        drop_cmd = f"DROP INDEX IF EXISTS \\\"{index}\\\";"
        run_psql_command(drop_cmd)
        count += 1
    
    print(f"Dropped {count} indices for {table_name}")

if __name__ == "__main__":
    drop_indices("notifications")
    drop_indices("notification_templates")
    drop_indices("cities")
