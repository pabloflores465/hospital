import json, traceback
from datetime import datetime, time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from .config import appointments_collection, users_collection

BUSINESS_START = time(8,0)
BUSINESS_END = time(16,30)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

def parse_datetime(date_str, time_str):
    return datetime.fromisoformat(f"{date_str}T{time_str}")

def is_conflict(doctor_id, start):
    return appointments_collection.find_one({
        "doctor": ObjectId(doctor_id),
        "start": start
    })

def validate_slot(start):
    weekday = start.weekday()
    slot_time = start.time()
    if weekday >= 5 or slot_time < BUSINESS_START or slot_time > BUSINESS_END:
        return False
    return True

@csrf_exempt
def create_appointment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        start = parse_datetime(data["date"], data["time"])
        if not validate_slot(start):
            raise ValueError("Horario inválido")
        if is_conflict(data["doctor"], start):
            raise ValueError("Slot ocupado")
        doc = {
            "doctor": ObjectId(data["doctor"]),
            "patient": ObjectId(data["patient"]),
            "start": start,
            "reason": data.get("reason", ""),
            "completed": False
        }
        result = appointments_collection.insert_one(doc)
        return JsonResponse({"_id": str(result.inserted_id)}, status=201)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_appointment(request, appointment_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        start = parse_datetime(data["date"], data["time"])
        if not validate_slot(start):
            raise ValueError("Horario inválido")
        if is_conflict(data["doctor"], start):
            raise ValueError("Slot ocupado")
        update = {
            "doctor": ObjectId(data["doctor"]),
            "patient": ObjectId(data["patient"]),
            "start": start,
            "reason": data.get("reason", ""),
            "diagnosis": data.get("diagnosis", ""),
            "exams": data.get("exams", ""),
            "medicines": data.get("medicines", ""),
            "next_steps": data.get("next_steps", ""),
            "completed": True
        }
        result = appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)}, {"$set": update}
        )
        if result.matched_count == 0:
            return JsonResponse({"error": "No encontrado"}, status=404)
        return JsonResponse({"updated": True})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def complete_appointment(request, appointment_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        update = {
            "diagnosis": data.get("diagnosis", ""),
            "exams": data.get("exams", ""),
            "medicines": data.get("medicines", ""),
            "next_steps": data.get("next_steps", ""),
            "completed": True
        }
        result = appointments_collection.update_one({"_id": ObjectId(appointment_id)}, {"$set": update})
        if result.matched_count == 0:
            return JsonResponse({"error": "Not found"}, status=404)
        return JsonResponse({"completed": True})
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_appointment(request, appointment_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        result = appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            return JsonResponse({"error": "No encontrado"}, status=404)
        return JsonResponse({"deleted": True})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def list_appointments(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    docs = []
    for appt in appointments_collection.find():
        appt = serialize(appt)
        # Convert nested ObjectId fields to strings for JSON serialization
        if isinstance(appt.get("doctor"), ObjectId):
            appt["doctor"] = str(appt["doctor"])
        if isinstance(appt.get("patient"), ObjectId):
            patient = users_collection.find_one({"_id": appt["patient"]})
            appt["patient"] = {"_id": str(patient["_id"]), "username": patient["username"]}
            appt["details"] = appt.get("reason", "")
        docs.append(appt)
    return JsonResponse({"appointments": docs}, status=200)