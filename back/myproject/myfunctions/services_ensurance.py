from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json, traceback
from bson import ObjectId
from .config import services_collection as collection
from django.views.decorators.csrf import csrf_exempt
from .config import services_collection, ensurances_collection

# Garantiza índice único
try:
    collection.create_index(
        [("service_id", 1), ("ensurance_id", 1)],
        unique=True
    )
except Exception:
    pass

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
        # Si el cuerpo de la solicitud viene como string (desde un archivo)
        if isinstance(request.body, bytes):
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Formato JSON inválido"}, status=400)
        else:
            payload = request.body

        if not isinstance(payload, dict) or "services" not in payload:
            return JsonResponse({"error": "El JSON debe contener un objeto con una clave 'services'"}, status=400)
        
        created = updated = services_created = errors = 0
        error_details = []
        
        for idx, svc in enumerate(payload.get("services", [])):
            try:
                # Verificar que los campos requeridos estén presentes
                if "service_id" not in svc or "ensurance_id" not in svc:
                    error_details.append(f"Servicio #{idx+1}: Falta service_id o ensurance_id")
                    errors += 1
                    continue
                
                # Intentar convertir IDs a ObjectId
                try:
                    service_id = ObjectId(svc["service_id"])
                except:
                    error_details.append(f"Servicio #{idx+1}: ID de servicio inválido: {svc['service_id']}")
                    errors += 1
                    continue
                
                try:
                    ensurance_id = ObjectId(svc["ensurance_id"])
                except:
                    error_details.append(f"Servicio #{idx+1}: ID de aseguradora inválido: {svc['ensurance_id']}")
                    errors += 1
                    continue
                
                # Verificar si el servicio existe y crearlo si no existe
                existing_service = services_collection.find_one({"_id": service_id})
                if not existing_service and "name" in svc:
                    # Crear el servicio si tiene un nombre
                    new_service = {
                        "_id": service_id,
                        "name": svc.get("name", f"Servicio {idx+1}"),
                        "category": svc.get("category", ""),
                        "subcategory": svc.get("subcategory", ""),
                        "copay": float(svc.get("copay", 0)),
                        "pay": float(svc.get("pay", 0)),
                        "total": float(svc.get("total", 0))
                    }
                    services_collection.insert_one(new_service)
                    services_created += 1
                
                filter_q = {
                    "service_id": service_id,
                    "ensurance_id": ensurance_id
                }
                
                # Obtener descripción y costo, con valores predeterminados
                description = svc.get("description", "")
                try:
                    cost = float(svc.get("cost", 0))
                except (ValueError, TypeError):
                    error_details.append(f"Servicio #{idx+1}: Costo inválido: {svc.get('cost')}")
                    errors += 1
                    continue
                
                update = {"$set": {
                    "description": description,
                    "cost": cost
                }}
                
                result = collection.update_one(filter_q, update, upsert=True)
                if result.upserted_id:
                    created += 1
                elif result.modified_count:
                    updated += 1
                
            except Exception as e:
                traceback.print_exc()
                error_details.append(f"Servicio #{idx+1}: Error inesperado: {str(e)}")
                errors += 1

        response_data = {
            "created": created, 
            "updated": updated,
            "services_created": services_created
        }
        
        # Si hubo errores, incluirlos en la respuesta
        if errors > 0:
            response_data["errors"] = errors
            response_data["error_details"] = error_details
        
        return JsonResponse(response_data, status=200)
        
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": f"Error al importar: {str(e)}"}, status=400)