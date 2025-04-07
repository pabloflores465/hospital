import json
import traceback
from django.http import JsonResponse
from bson import ObjectId
from django.views.decorators.csrf import csrf_exempt
from .config import services_collection
from .get_list import get_list
from .convert_objectid import convert_objectid, ensure_serializable

@csrf_exempt
def create_service(request):
    """POST /api/services/ - Crea un servicio"""
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        doc = {
            "name": data["name"],
            "categories": [ObjectId(cid) for cid in data.get("categories", [])],
            "subcategories": [ObjectId(sid) for sid in data.get("subcategories", [])],
            "ensurances": [ObjectId(eid) for eid in data.get("ensurances", [])],
            "copay": float(data["copay"]),
            "pay": float(data["pay"]),
            "total": float(data["total"]),
            "deleted": False
        }
        result = services_collection.insert_one(doc)
        return JsonResponse({"_id": str(result.inserted_id)}, status=201)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

def get_services(request):
    if request.method == "GET":
        try:
            services = []
            # Llenamos la lista con los documentos de services_collection
            # Suponiendo que get_list agrega documentos a la lista pasada
            get_list(services, services_collection)
            
            # Filtramos solo aquellos que no están marcados como eliminados
            services = [service for service in services if not service.get("deleted", False)]
            
            # Convertimos _id a string para que sea JSON serializable
            for service in services:
                service["_id"] = str(service["_id"])
                
            return JsonResponse({"services": services}, status=200)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def update_service(request, service_id):
    """PUT /api/services/<service_id>/ - Actualiza un servicio"""
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        update_fields = {k: v for k, v in data.items() if k in ["name", "copay", "pay", "total"]}
        result = services_collection.update_one({"_id": ObjectId(service_id)}, {"$set": update_fields})
        if result.matched_count == 0:
            return JsonResponse({"error": "Servicio no encontrado"}, status=404)
        return JsonResponse({"updated": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_service(request, service_id):
    """DELETE /api/services/<service_id>/ - Soft Delete"""
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        result = services_collection.update_one({"_id": ObjectId(service_id)}, {"$set": {"deleted": True}})
        if result.matched_count == 0:
            return JsonResponse({"error": "Servicio no encontrado"}, status=404)
        return JsonResponse({"deleted": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

def get_service_by_id(request, service_id):
    """GET /api/services/<service_id> - Obtiene un servicio específico por ID"""
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    print(f"Buscando servicio con ID: {service_id}")
    
    try:
        # Convertir el ID a ObjectId
        try:
            obj_id = ObjectId(service_id)
            print(f"ObjectId válido: {obj_id}")
        except Exception as e:
            print(f"Error al convertir ID: {str(e)}")
            return JsonResponse({"error": f"ID de servicio inválido: {service_id}"}, status=400)
        
        # Buscar el servicio en la base de datos
        service = services_collection.find_one({"_id": obj_id})
        
        if service is None:
            print(f"Servicio no encontrado con ID: {service_id}")
            return JsonResponse({"error": "Servicio no encontrado"}, status=404)
        
        # Convertir todos los ObjectId a string usando la función mejorada
        serializable_service = ensure_serializable(service)
        
        print(f"Servicio procesado: {serializable_service}")
        
        return JsonResponse(serializable_service, status=200, safe=False)
    except Exception as e:
        traceback.print_exc()
        print(f"Error al obtener servicio: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)
