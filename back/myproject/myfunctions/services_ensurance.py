from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json, traceback
from bson import ObjectId
from .db import get_db

db = get_db()
collection = db.services_ensurance

# Garantiza índice único
collection.create_index(
    [("service_id", 1), ("ensurance_id", 1)],
    unique=True
)

def get_services_ensurance(request):
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        docs = []
        for doc in collection.find():
            doc["_id"] = str(doc["_id"])
            doc["service_id"] = str(doc["service_id"])
            doc["ensurance_id"] = str(doc["ensurance_id"])
            docs.append(doc)
        return JsonResponse({"services_ensurance": docs}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def import_services_ensurance(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        payload = json.loads(request.body)
        created = updated = 0
        for svc in payload.get("services", []):
            filter_q = {
                "service_id": ObjectId(svc["service_id"]),
                "ensurance_id": ObjectId(svc["ensurance_id"])
            }
            update = {"$set": {
                "description": svc.get("description", ""),
                "cost": float(svc.get("cost", 0))
            }}
            result = collection.update_one(filter_q, update, upsert=True)
            if result.upserted_id:
                created += 1
            elif result.modified_count:
                updated += 1

        return JsonResponse({"created": created, "updated": updated}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)