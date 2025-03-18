from pymongo import MongoClient
from django.conf import settings

def get_db():
    client = MongoClient(settings.MONGODB_URI)
    return client[settings.MONGODB_NAME] 