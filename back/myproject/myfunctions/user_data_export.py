from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId, json_util
import json
import traceback
from .config import (
    users_collection,
    recipes_collection,
    appointments_collection,
    medical_records_collection,
)

@csrf_exempt
def export_user_data(request):
    """
    Exporta todos los datos de un usuario (diagnósticos, exámenes, recetas, etc.) en formato JSON
    """
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Verificar si se solicita exportar todos los usuarios
        export_all = request.GET.get("export_all") == "true"
        
        # Si no se exportan todos, verificar si se proporciona user_id o email
        if not export_all:
            user_id = request.GET.get("user_id")
            email = request.GET.get("email")
            
            if not user_id and not email:
                return JsonResponse({"error": "Se requiere user_id o email, o export_all=true"}, status=400)
            
            # Buscar usuario por ID
            if user_id:
                try:
                    user_id = ObjectId(user_id)
                    user_data = users_collection.find_one({"_id": user_id})
                except:
                    return JsonResponse({"error": "ID de usuario inválido"}, status=400)
            # Buscar usuario por email
            else:
                user_data = users_collection.find_one({"email": email})
                
            if not user_data:
                return JsonResponse({"error": "Usuario no encontrado"}, status=404)
            
            # Convertir _id a string para serialización JSON
            user_id = user_data["_id"]
            user_data["_id"] = str(user_data["_id"])
            
            # Obtener recetas del usuario
            recipes = []
            for recipe in recipes_collection.find({"patient_id": user_id}):
                recipe["_id"] = str(recipe["_id"])
                if "doctor_id" in recipe and recipe["doctor_id"]:
                    recipe["doctor_id"] = str(recipe["doctor_id"])
                if "patient_id" in recipe and recipe["patient_id"]:
                    recipe["patient_id"] = str(recipe["patient_id"])
                recipes.append(recipe)
            
            # Obtener citas del usuario
            appointments = []
            for appointment in appointments_collection.find({"patient_identifier": str(user_id)}):
                appointment["_id"] = str(appointment["_id"])
                appointments.append(appointment)
            
            # Obtener registros médicos del usuario
            medical_records = []
            for record in medical_records_collection.find({"patient_id": str(user_id)}):
                record["_id"] = str(record["_id"])
                medical_records.append(record)
            
            # Construir el objeto completo de datos del usuario
            export_data = {
                "user": user_data,
                "recipes": recipes,
                "appointments": appointments,
                "medical_records": medical_records,
            }
            
            # Configurar el nombre del archivo
            filename = f"user_data_{str(user_id)}.json"
            
        else:
            # Exportar datos de todos los usuarios
            all_users = []
            
            for user_data in users_collection.find():
                user_id = user_data["_id"]
                user_info = {
                    "user": user_data,
                    "recipes": [],
                    "appointments": [],
                    "medical_records": []
                }
                
                # Convertir _id a string
                user_info["user"]["_id"] = str(user_id)
                
                # Obtener recetas del usuario
                for recipe in recipes_collection.find({"patient_id": user_id}):
                    recipe["_id"] = str(recipe["_id"])
                    if "doctor_id" in recipe and recipe["doctor_id"]:
                        recipe["doctor_id"] = str(recipe["doctor_id"])
                    if "patient_id" in recipe and recipe["patient_id"]:
                        recipe["patient_id"] = str(recipe["patient_id"])
                    user_info["recipes"].append(recipe)
                
                # Obtener citas del usuario
                for appointment in appointments_collection.find({"patient_identifier": str(user_id)}):
                    appointment["_id"] = str(appointment["_id"])
                    user_info["appointments"].append(appointment)
                
                # Obtener registros médicos del usuario
                for record in medical_records_collection.find({"patient_id": str(user_id)}):
                    record["_id"] = str(record["_id"])
                    user_info["medical_records"].append(record)
                
                all_users.append(user_info)
            
            export_data = {
                "users": all_users
            }
            
            # Configurar el nombre del archivo
            filename = "all_users_data.json"
        
        # Configurar la respuesta como archivo descargable
        response = HttpResponse(
            json.dumps(export_data, default=str),
            content_type="application/json"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def import_user_data(request):
    """
    Importa datos de usuario desde un archivo JSON
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Verificar si se envió un archivo
        if "file" not in request.FILES:
            # Intentar leer del cuerpo de la solicitud si no hay archivo
            try:
                import_data = json.loads(request.body)
            except:
                return JsonResponse(
                    {"error": "No se proporcionó archivo o datos JSON válidos"}, 
                    status=400
                )
        else:
            # Leer datos del archivo
            file = request.FILES["file"]
            import_data = json.loads(file.read())
        
        # Validar la estructura del archivo importado
        required_keys = ["user", "recipes", "appointments", "medical_records"]
        for key in required_keys:
            if key not in import_data:
                return JsonResponse(
                    {"error": f"Archivo de importación inválido: falta la sección '{key}'"}, 
                    status=400
                )
        
        user_data = import_data["user"]
        
        # Verificar si el usuario ya existe
        existing_user = None
        if "_id" in user_data:
            try:
                existing_user = users_collection.find_one({"_id": ObjectId(user_data["_id"])})
            except:
                pass
        
        if not existing_user and "email" in user_data:
            existing_user = users_collection.find_one({"email": user_data["email"]})
        
        # Prepara estadísticas para el resultado
        stats = {
            "user": "creado" if not existing_user else "actualizado",
            "recipes_created": 0,
            "recipes_updated": 0,
            "appointments_created": 0,
            "appointments_updated": 0,
            "medical_records_created": 0,
            "medical_records_updated": 0,
        }
        
        # Convertir el ID del usuario de str a ObjectId si existe
        user_id = None
        if existing_user:
            user_id = existing_user["_id"]
            # Actualizar usuario existente
            if "_id" in user_data:
                del user_data["_id"]  # Eliminar ID para la actualización
            users_collection.update_one({"_id": user_id}, {"$set": user_data})
        else:
            # Crear nuevo usuario
            if "_id" in user_data:
                try:
                    user_data["_id"] = ObjectId(user_data["_id"])
                except:
                    del user_data["_id"]  # Eliminar ID inválido
            
            result = users_collection.insert_one(user_data)
            user_id = result.inserted_id
        
        # Importar recetas
        for recipe in import_data["recipes"]:
            # Preparar la receta para importación
            if "_id" in recipe:
                recipe_id = recipe["_id"]
                del recipe["_id"]
                # Verificar si la receta ya existe
                existing_recipe = recipes_collection.find_one({"_id": ObjectId(recipe_id)})
                if existing_recipe:
                    recipes_collection.update_one({"_id": ObjectId(recipe_id)}, {"$set": recipe})
                    stats["recipes_updated"] += 1
                else:
                    recipe["_id"] = ObjectId(recipe_id)
                    recipes_collection.insert_one(recipe)
                    stats["recipes_created"] += 1
            else:
                result = recipes_collection.insert_one(recipe)
                stats["recipes_created"] += 1
        
        # Importar citas
        for appointment in import_data["appointments"]:
            if "_id" in appointment:
                appointment_id = appointment["_id"]
                del appointment["_id"]
                existing_appointment = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
                if existing_appointment:
                    appointments_collection.update_one({"_id": ObjectId(appointment_id)}, {"$set": appointment})
                    stats["appointments_updated"] += 1
                else:
                    appointment["_id"] = ObjectId(appointment_id)
                    appointments_collection.insert_one(appointment)
                    stats["appointments_created"] += 1
            else:
                result = appointments_collection.insert_one(appointment)
                stats["appointments_created"] += 1
        
        # Importar registros médicos
        for record in import_data["medical_records"]:
            if "_id" in record:
                record_id = record["_id"]
                del record["_id"]
                existing_record = medical_records_collection.find_one({"_id": ObjectId(record_id)})
                if existing_record:
                    medical_records_collection.update_one({"_id": ObjectId(record_id)}, {"$set": record})
                    stats["medical_records_updated"] += 1
                else:
                    record["_id"] = ObjectId(record_id)
                    medical_records_collection.insert_one(record)
                    stats["medical_records_created"] += 1
            else:
                result = medical_records_collection.insert_one(record)
                stats["medical_records_created"] += 1
        
        return JsonResponse({
            "success": True,
            "message": "Datos importados correctamente",
            "stats": stats
        }, status=200)
        
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500) 