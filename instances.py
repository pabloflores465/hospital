from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import subprocess, time, signal, sys, os, json, socket

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

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["instance_db"]
ip = '0.0.0.0'

def main():
    try:
        response = client.admin.command('ping')
        if response.get("ok") == 1.0:
            print("Conexión exitosa a MongoDB.")
        else:
            print("Error en la conexión a MongoDB.")

        hospitals = list(db["hospitals"].find())
        
        variables_proc = subprocess.Popen(["uvicorn", "back_url:app", "--reload"])
        processes.append(variables_proc)

        for hospital in hospitals:
            hospital_data = { 
                "mongo_uri": MONGO_URI, "database_name": hospital["database_name"],
                "back_port": hospital["back_port"], "front_port": hospital["front_port"],
                "api_url": f"http://{ip}:{hospital['back_port']}" 
            }

            with open('./back/myproject/myfunctions/variables.json', 'w') as f:
                json.dump(hospital_data, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            
            back_proc = subprocess.Popen(["python3", "back/manage.py", "runserver", f"0.0.0.0:{hospital['back_port']}"])
            processes.append(back_proc)

            front_proc = subprocess.Popen(["ng", "serve", "--host", "0.0.0.0", "--port", str(hospital['front_port'])], cwd="front")
            processes.append(front_proc)

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

if __name__ == "__main__":
    main()