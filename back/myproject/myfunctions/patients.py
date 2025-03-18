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