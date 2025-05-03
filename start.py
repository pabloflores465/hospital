import socket
import subprocess
import sys
import time
from pymongo import MongoClient

env_path = ".env"

with open(env_path, "w") as file:
    pass

def get_local_ip():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # 8.8.8.8:53 is just a reachable public IP and port
        sock.connect(("8.8.8.8", 53))
        return sock.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        sock.close()

with open(env_path, "a") as file:
    file.write(f"ip={get_local_ip()}\n")

processes = []

back_ports = []
def init_back_server(hospital_port):
    start_back = subprocess.Popen(["python3", "manage.py", "runserver", f"{get_local_ip()}:{hospital_port}"], cwd="back")
    processes.append(start_back)
    back_ports.append(hospital_port)

front_ports = []
def init_front_server(hospital_port):
    # Install front-end dependencies first
    subprocess.run(["npm", "install"], cwd="front", check=True)
    # Start Angular server
    start_front = subprocess.Popen(
        ["ng", "serve", "--host", get_local_ip(), "--port", str(hospital_port)],
        cwd="front"
    )
    processes.append(start_front)
    front_ports.append(hospital_port)

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["instance_db"]

hospitals = list(db["hospitals"].find())

try:
    names = []
    databases = []
    for hospital in hospitals:
        init_back_server(hospital["back_port"])
        init_front_server(hospital["front_port"])
        names.append(hospital["name"])
        databases.append(hospital["database_name"])

    with open(env_path, "a") as file:
        file.write(f"back_ports={str(back_ports)}\n")
        file.write(f"front_ports={str(front_ports)}\n")
        file.write(f"hospital_names={str(names)}\n")
        file.write(f"hospital_databases={str(databases)}\n")

    while True:
        time.sleep(1)

except KeyboardInterrupt:
    for process in processes:
        process.terminate()
    sys.exit(0)
