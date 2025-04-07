from fastapi import FastAPI
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["instance_db"]
ip = '0.0.0.0'

@app.get("/back_url/{front_port}")
async def get_variables(front_port: int = None):
    hospital = db.hospitals.find_one({"front_port": front_port})
    url = f"http://{ip}:{hospital['back_port']}/"
    return url