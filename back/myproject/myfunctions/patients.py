from django.http import JsonResponse
from .config import users_collection

def get_patient_count(request):
    if request.method == "GET":
        try:
            patient_count = users_collection.count_documents({"rol": "paciente"})
            return JsonResponse({"patient_count": patient_count}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

def get_patient_history(request, user_id):
    if request.method == "GET":
        try:
            patient = users_collection.find_one({"_id": user_id, "role": "paciente"})
            if patient:
                patient["_id"] = str(patient["_id"])
                if patient.get("profile"):
                    patient.pop("profile", None)
                patient.pop("password", None)
                return JsonResponse({"patient": patient}, status=200)
            else:
                return JsonResponse({"error": "Paciente no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)