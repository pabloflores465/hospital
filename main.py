import subprocess, time, signal, sys, os, json, socket
from variables import MONGO_URI, db, ip

def wait_for_server(host, port, timeout=60):
    start_time = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except Exception:
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Server on {host}:{port} did not start in {timeout} seconds")
            time.sleep(1)

processes = []

def signal_handler(sig, frame):
    print("\nTerminating background processes...")
    for proc in processes:
        proc.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def main():
    hospitals = list(db["hospitals"].find())
        
    variables_proc = subprocess.Popen(["uvicorn", "back_url:app", "--reload"])
    processes.append(variables_proc)

    for hospital in hospitals:
        hospital_data = { 
            "mongo_uri": MONGO_URI, "database_name": hospital["database_name"],
            "back_port": hospital["back_port"], "front_port": hospital["front_port"],
            "api_url": f"http://{ip}:{hospital['back_port']}" 
        }

        with open('./back/myproject/server_config.json', 'w') as f:
            json.dump(hospital_data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
            
        back_proc = subprocess.Popen(["python3", "back/manage.py", "runserver", f"0.0.0.0:{hospital['back_port']}"])
        processes.append(back_proc)

        front_proc = subprocess.Popen(["ng", "serve", "--host", "0.0.0.0", "--port", str(hospital['front_port'])], cwd="front")
        processes.append(front_proc)

        wait_for_server("localhost", hospital['back_port'])
        wait_for_server("localhost", hospital['front_port'])

    print("Servers started. Press Ctrl+C to stop them.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()