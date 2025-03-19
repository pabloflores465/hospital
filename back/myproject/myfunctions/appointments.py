from django.http import JsonResponse
from bson import ObjectId
from .config import appointments_collection, users_collection

def get_appointments(request, patient_id = None, doctor_id = None):
    if request.method == "GET":
        try:
            if patient_id:
                appointments = list(appointments_collection.find({"patient": ObjectId(patient_id)}))
            elif doctor_id:
                appointments = list(appointments_collection.find({"doctor": ObjectId(doctor_id)}))
            else:
                appointments = list(appointments_collection.find({}))

            for appointment in appointments:
                appointment["_id"] = str(appointment["_id"])
                
                if appointment.get("doctor"):
                    doctor = users_collection.find_one({"_id": ObjectId(appointment["doctor"])})
                    if doctor:
                        doctor["_id"] = str(doctor["_id"])
                        doctor.pop("profile", None)
                        appointment["doctor"] = doctor
                    else:
                        appointment["doctor"] = ""
                
                if appointment.get("patient"):
                    patient = users_collection.find_one({"_id": ObjectId(appointment["patient"])})
                    if patient:
                        patient["_id"] = str(patient["_id"])
                        patient.pop("profile", None)
                        appointment["patient"] = patient
                    else:
                        appointment["patient"] = ""

            return JsonResponse({"appointments": appointments}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)