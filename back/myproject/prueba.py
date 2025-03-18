from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["hospital_db"]
collection = db["Hospital"]

# Insertar un documento de prueba
test_data = {"nombre": "Hospital Central", "ciudad": "San José"}
result = collection.insert_one(test_data)

print(f"✅ Documento insertado con ID: {result.inserted_id}")