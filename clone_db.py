from pymongo import MongoClient

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)

clone_database_name  = input("Enter the clone database name: ")
db = client[clone_database_name]

new_database_name  = input("Enter the clone database name: ")
new_db = client[new_database_name]

for collection in db.list_collections():
    current_collection = db[collection["name"]]
    new_collection = new_db[collection["name"]]
    for doc in current_collection.find():
        new_collection.insert_one(doc)

print("Database created successfully")

client.close()