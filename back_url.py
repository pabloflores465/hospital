from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from variables import db, ip
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/back_url/{front_port}")
async def get_variables(front_port: int = None):
    hospital = db.hospitals.find_one({"front_port": front_port})
    url = f"http://{ip}:{hospital['back_port']}"
    return url