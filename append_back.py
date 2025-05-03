import subprocess
import time
import sys
import socket
env_path = "../.env"

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

processes = []
def init_back_server(hospital_port):
    start_back = subprocess.Popen(["python3", "manage.py", "runserver", f"{get_local_ip()}:{hospital_port}"], cwd="back")
    processes.append(start_back)

hospital_port = input("Enter the port number for the hospital: ")
init_back_server(hospital_port)

with open(env_path, "a") as file:
    file.write(f"hospital_port={hospital_port}\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    for process in processes:
        process.terminate()
    sys.exit(0)
