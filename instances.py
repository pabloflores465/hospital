from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import subprocess, time, signal, sys, os
import json
import socket

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
    print("Terminando procesos en segundo plano...")
    for proc in processes:
        proc.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

try:
    MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(MONGO_URI)
    db = client["instance_db"]
    
    response = client.admin.command('ping')
    if response.get("ok") == 1.0:
        print("Conexión exitosa a MongoDB.")
    else:
        print("Error en la conexión a MongoDB.")

    hospitals = list(db["hospitals"].find())
    print(f'Hospitals Found: {hospitals}')
    
    for hospital in hospitals:
        hospital_data = { "mongo_uri": MONGO_URI, "database_name": hospital["database_name"] }
        with open('./back/myproject/myfunctions/variables.json', 'w') as f:
            json.dump(hospital_data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        
        with open('./front/src/app/connection.json', 'w') as f:
            json.dump({ "ip": "0.0.0.0", "port": hospital['back_port'] }, f, indent=2)
            f.flush()
            os.fsync(f.fileno())

        back_proc = subprocess.Popen(["python3", "back/manage.py", "runserver", f"0.0.0.0:{hospital['back_port']}"])
        processes.append(back_proc)

        front_proc = subprocess.Popen(["ng", "serve", "--host", "0.0.0.0", "--port", str(hospital['front_port'])], cwd="front")
        processes.append(front_proc)

        # Wait until both back and front servers are up
        wait_for_server("localhost", hospital['back_port'])
        wait_for_server("localhost", hospital['front_port'])


    print("Servidores iniciados. Presione Ctrl+C para detenerlos.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Interrupción detectada, terminando procesos en segundo plano...")
except ConnectionFailure as e:
    print(f"Error de conexión a MongoDB: {e}")
finally:
    for proc in processes:
        proc.terminate()