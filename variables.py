from pymongo import MongoClient
MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["instance_db"]
ip = '0.0.0.0'