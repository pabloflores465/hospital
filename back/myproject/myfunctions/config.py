from pymongo import MongoClient

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000"
client = MongoClient(MONGO_URI)
db = client["hospital_db"]
users_collection = db["users"]
medicines_collection = db["medicines"]
recipes_collection = db["recipes"]
categories_collection = db["categories"]
subcategories_collection = db["subcategories"]
