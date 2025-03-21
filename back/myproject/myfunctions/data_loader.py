import json
import os
import sys
from pymongo import MongoClient
from bson import ObjectId

# Añadir el directorio padre al path para poder importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from myfunctions.config import get_db

class JSONDecoder(json.JSONDecoder):
    def __init__(self, *args, **kwargs):
        json.JSONDecoder.__init__(self, object_hook=self.object_hook, *args, **kwargs)
    
    def object_hook(self, obj):
        for key, value in obj.items():
            if key == '$date':
                return value  # Simplemente devolvemos la fecha en formato string
            elif key == '_id' and isinstance(value, str):
                # Intentar convertir a ObjectId si parece un ObjectId válido
                try:
                    if ObjectId.is_valid(value):
                        obj[key] = ObjectId(value)
                except:
                    pass
        return obj

def load_data_from_json(file_path, collection):
    """
    Carga datos desde un archivo JSON a una colección de MongoDB
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file, cls=JSONDecoder)
            
            if data:
                # Si data es una lista, insertamos muchos documentos
                if isinstance(data, list):
                    # Convertir procedure_id de string a ObjectId si aplica
                    for item in data:
                        if 'procedure_id' in item and item['procedure_id'].startswith('procedure_'):
                            # Reemplazar procedure_1 con un ObjectId real de la colección medical_procedures
                            proc_num = int(item['procedure_id'].split('_')[1])
                            # Usar un índice base 0, así procedure_1 corresponde al primer elemento
                            cursor = db.medical_procedures.find().limit(proc_num).skip(proc_num - 1)
                            actual_proc = list(cursor)
                            if actual_proc:
                                item['procedure_id'] = actual_proc[0]['_id']
                    
                    # Insertar los documentos
                    result = collection.insert_many(data)
                    print(f"Se insertaron {len(result.inserted_ids)} documentos en {collection.name}")
                # Si data es un diccionario, insertamos un solo documento
                else:
                    result = collection.insert_one(data)
                    print(f"Se insertó 1 documento en {collection.name} con ID: {result.inserted_id}")
                return True
            else:
                print(f"No se encontraron datos en {file_path}")
                return False
    except Exception as e:
        print(f"Error al cargar datos desde {file_path}: {str(e)}")
        return False

def main():
    """
    Función principal para cargar todos los datos de ejemplo
    """
    print("Iniciando carga de datos de ejemplo...")
    
    # Obtener la conexión a la base de datos
    global db
    db = get_db()
    
    # Definir la ruta base para los archivos JSON
    base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    
    # Definir las colecciones y sus archivos JSON correspondientes
    collections = [
        {"name": "medical_records", "file": "medical_records_sample.json"},
        {"name": "medical_procedures", "file": "medical_procedures_sample.json"},
        {"name": "medical_comments", "file": "medical_comments_sample.json"},
        {"name": "medical_attachments", "file": "medical_attachments_sample.json"}
    ]
    
    # Cargar datos en cada colección
    for collection_info in collections:
        collection_name = collection_info["name"]
        file_path = os.path.join(base_path, collection_info["file"])
        
        # Verificar si el archivo existe
        if not os.path.exists(file_path):
            print(f"Archivo no encontrado: {file_path}")
            continue
        
        # Verificar si la colección ya tiene datos
        if db[collection_name].count_documents({}) > 0:
            print(f"La colección {collection_name} ya tiene datos. Omitiendo...")
            continue
        
        # Cargar datos en la colección
        print(f"Cargando datos en {collection_name} desde {file_path}...")
        load_data_from_json(file_path, db[collection_name])
    
    print("Carga de datos completada.")

if __name__ == "__main__":
    main() 