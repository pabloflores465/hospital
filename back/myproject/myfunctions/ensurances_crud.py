import json
import traceback
from django.http import JsonResponse
from bson import ObjectId
from django.views.decorators.csrf import csrf_exempt
from .config import ensurances_collection  # Defínela en config.py
from .get_list import get_list

@csrf_exempt
def create_ensurance(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        doc = {
            "name": data["name"],
            "coverageDescription": data.get("coverageDescription", "")
        }
        result = ensurances_collection.insert_one(doc)
        return JsonResponse({"_id": str(result.inserted_id)}, status=201)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

def get_ensurances(request):
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        ensurances = []
        get_list(ensurances, ensurances_collection)
        for ens in ensurances:
            ens["_id"] = str(ens["_id"])
        return JsonResponse({"ensurances": ensurances}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_ensurance(request, ensurance_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        update_fields = {}
        if "name" in data:
            update_fields["name"] = data["name"]
        if "coverageDescription" in data:
            update_fields["coverageDescription"] = data["coverageDescription"]
        result = ensurances_collection.update_one({"_id": ObjectId(ensurance_id)}, {"$set": update_fields})
        if result.matched_count == 0:
            return JsonResponse({"error": "Aseguradora no encontrada"}, status=404)
        return JsonResponse({"updated": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_ensurance(request, ensurance_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        result = ensurances_collection.delete_one({"_id": ObjectId(ensurance_id)})
        if result.deleted_count == 0:
            return JsonResponse({"error": "Aseguradora no encontrada"}, status=404)
        return JsonResponse({"deleted": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)
