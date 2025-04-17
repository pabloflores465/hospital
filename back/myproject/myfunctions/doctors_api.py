from django.http import JsonResponse
from .config import users_collection
from bson import ObjectId

def list_doctors(request):
    """
    Lista todos los doctores para seleccionar en reportes
    """
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Buscar todos los usuarios con rol de doctor
        doctors = []
        for doc in users_collection.find({"rol": "doctor"}):
            # Convertir ObjectId a string
            doc["_id"] = str(doc["_id"])
            
            # Eliminar datos sensibles
            if "password" in doc:
                del doc["password"]
            if "profile" in doc and doc["profile"]:
                # Si profile es un ObjectId, no lo incluimos
                if isinstance(doc["profile"], ObjectId):
                    del doc["profile"]
            
            doctors.append(doc)
            
        return JsonResponse({"doctors": doctors}, status=200)
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500) 