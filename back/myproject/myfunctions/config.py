from pymongo import MongoClient

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000"
client = MongoClient(MONGO_URI)
db = client["hospital_db"]
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
medical_records_collection = db['medical_records']
medical_procedures_collection = db['medical_procedures']
medical_comments_collection = db['medical_comments']
medical_attachments_collection = db['medical_attachments']

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
