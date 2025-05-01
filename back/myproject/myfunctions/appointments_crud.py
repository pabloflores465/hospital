import json, traceback
from datetime import datetime, time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from .config import appointments_collection, users_collection
from django.utils.dateparse import parse_datetime
from django.core.mail import send_mail
from django.conf import settings

BUSINESS_START = time(8,0)
BUSINESS_END = time(16,30)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

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
        
        # Verificar credenciales del usuario que crea la cita
        creator_id = data.get("creator_id")
        
        # Si hay un creator_id, verificamos que sea staff
        is_staff = False
        if creator_id:
            creator = users_collection.find_one({"_id": ObjectId(creator_id)})
            if creator and creator.get("rol") in ["staff", "admin"]:
                is_staff = True
                
        start_str = data.get("start")
        if not start_str:
            return JsonResponse({"error": "Missing start datetime"}, status=400)
        start = parse_datetime(start_str)
        if start is None:
            return JsonResponse({"error": "Invalid start datetime format"}, status=400)
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
        
        # Guardar la cita
        result = appointments_collection.insert_one(doc)
        
        # Enviar correo de notificación al paciente
        try:
            # Obtener datos del paciente y doctor para el correo
            patient = users_collection.find_one({"_id": ObjectId(data["patient"])})
            doctor = users_collection.find_one({"_id": ObjectId(data["doctor"])})
            
            if patient and patient.get("email") and doctor:
                doctor_name = doctor.get("name", doctor.get("username", ""))
                formatted_date = start.strftime("%d/%m/%Y a las %H:%M")
                
                # Enviar correo
                send_mail(
                    f"Nueva cita médica programada - {formatted_date}",
                    f"""Hola {patient.get('name', patient.get('username', ''))},

Le informamos que se ha programado una cita médica para usted:

Fecha y hora: {formatted_date}
Doctor: {doctor_name}
Motivo: {data.get('reason', 'No especificado')}

Si necesita reprogramar o cancelar esta cita, por favor contacte con nuestro personal.

Saludos,
El equipo del hospital
""",
                    settings.EMAIL_HOST_USER,
                    [patient["email"]],
                    fail_silently=False,
                )
        except Exception as e:
            print(f"Error al enviar correo: {str(e)}")
            # No impedimos que se cree la cita si falla el correo
        
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
        start_str = data.get("start")
        if not start_str:
            return JsonResponse({"error": "Missing start datetime"}, status=400)
        start = parse_datetime(start_str)
        if start is None:
            return JsonResponse({"error": "Invalid start datetime format"}, status=400)
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