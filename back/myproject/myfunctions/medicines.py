from django.http import JsonResponse
from .config import db
from .convert_objectid import convert_objectid

def get_principios_activos(request):
    if request.method == "GET":
        try:
            # Obtener la colección
            principios_collection = db["principios_activos"]
            
            # Obtener todos los documentos
            principios = []
            cursor = principios_collection.find({})
            
            # Convertir cada documento y añadirlo a la lista
            for doc in cursor:
                # Convertir ObjectId a string
                doc = convert_objectid(doc)
                principios.append(doc)
                
            # Devolver la lista como respuesta JSON
            return JsonResponse({"principios_activos": principios}, status=200)
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405) 