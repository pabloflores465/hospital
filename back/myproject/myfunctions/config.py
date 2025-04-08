import os
from pymongo import MongoClient
import json 

# Construir la ruta al archivo de configuración relativa a este archivo
current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(os.path.dirname(current_dir), 'server_config.json')

with open(config_path, 'r') as f:
    server_config = json.load(f)

MONGO_URI = server_config["mongo_uri"]
client = MongoClient(MONGO_URI)
db = client[server_config["database_name"]]
users_collection = db["users"]
medicines_collection = db["medicines"]
recipes_collection = db["recipes"]
categories_collection = db["categories"]
subcategories_collection = db["subcategories"]
services_collection = db["services"]
results_collection = db["results"]
ensurances_collection = db["ensurances"]
profiles_collection = db["profile"]
appointments_collection = db["appointments"]
comments_collection = db["comments"]
footer_collection = db["footer"]

# Nuevas colecciones para la ficha histórica
medical_records_collection = db["medical_records"]
medical_procedures_collection = db["medical_procedures"]
medical_comments_collection = db["medical_comments"]
medical_attachments_collection = db["medical_attachments"]

# Crear índices necesarios
medical_records_collection.create_index([("patient_id", 1)], unique=True)
medical_procedures_collection.create_index([("patient_id", 1)])
medical_comments_collection.create_index([("procedure_id", 1)])
medical_attachments_collection.create_index([("procedure_id", 1)])


# Función para obtener la conexión a la base de datos
def get_db():
    """
    Devuelve la instancia de la base de datos
    """
    return db


history_collection = db["history"]
moderation_collection = db["moderation"]
audit_collection = db["audit"]
mission_collection = db["mission"]
vision_collection = db["vision"]
contact_collection = db["contact"]
faq_collection = db["faq"]
