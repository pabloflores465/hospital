from django.http import JsonResponse
from datetime import datetime
from bson import ObjectId
from .config import appointments_collection, users_collection, recipes_collection, medicines_collection, moderation_collection
import traceback

def doctor_appointments_report(request):
    """
    Genera un reporte de consultas por doctor en un rango de fechas
    """
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
        
    # Obtener parámetros
    doctor_id = request.GET.get('doctor_id')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    report_type = request.GET.get('report_type')
    
    # Validar parámetros
    if not all([doctor_id, start_date_str, end_date_str, report_type]):
        return JsonResponse({"error": "Faltan parámetros requeridos"}, status=400)
        
    if report_type not in ["grouped", "individual"]:
        return JsonResponse({"error": "Tipo de reporte inválido"}, status=400)
        
    try:
        # Convertir fechas
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        
        # Imprimir para depuración
        print(f"Generando reporte para doctor: {doctor_id}, desde: {start_date} hasta: {end_date}, tipo: {report_type}")
        
        # Obtener datos del doctor
        doctor = None
        try:
            doctor_obj_id = ObjectId(doctor_id)
            doctor = users_collection.find_one({"_id": doctor_obj_id, "rol": "doctor"})
        except:
            # Si no es un ObjectId válido, buscar por otros campos
            doctor = users_collection.find_one({"email": doctor_id, "rol": "doctor"})
            
        if not doctor:
            return JsonResponse({"error": "Doctor no encontrado"}, status=404)
            
        doctor_info = {
            "id": str(doctor["_id"]),
            "name": doctor.get("username", ""),
            "specialty": ""
        }
        
        # Intentar obtener la especialidad desde profile si existe
        if "profile" in doctor and doctor["profile"] is not None:
            # Si profile es un ObjectId, obtener el documento
            if isinstance(doctor["profile"], ObjectId):
                profile_doc = users_collection.find_one({"_id": doctor["profile"]})
                if profile_doc and "title" in profile_doc:
                    doctor_info["specialty"] = profile_doc["title"]
            # Si profile es un diccionario, obtener title directamente
            elif isinstance(doctor["profile"], dict) and "title" in doctor["profile"]:
                doctor_info["specialty"] = doctor["profile"]["title"]
        
        # Consultar citas en el rango de fechas
        doctor_obj_id = doctor["_id"]
        
        print(f"Buscando citas para doctor ID: {doctor_obj_id}")
        query = {
            "doctor": doctor_obj_id,
            "start": {"$gte": start_date, "$lte": end_date}
        }
        
        print(f"Query: {query}")
        appointments = list(appointments_collection.find(query).sort("start", 1))
        
        print(f"Encontradas {len(appointments)} citas")
        
        # Si no hay citas, intentar buscar por ID como string
        if len(appointments) == 0:
            doctor_id_str = str(doctor_obj_id)
            query_str = {
                "doctor": doctor_id_str,
                "start": {"$gte": start_date, "$lte": end_date}
            }
            print(f"Buscando con ID como string: {doctor_id_str}")
            appointments = list(appointments_collection.find(query_str).sort("start", 1))
            print(f"Encontradas {len(appointments)} citas con ID como string")
        
        # Si aún no hay citas, devolver respuesta vacía
        if len(appointments) == 0:
            return JsonResponse({
                "doctor": doctor_info,
                "start_date": start_date_str,
                "end_date": end_date_str,
                "report_type": report_type,
                "data": [],
                "summary": {
                    "total_appointments": 0,
                    "total_insurance_payment": 0,
                    "total_direct_payment": 0
                }
            })
        
        # Construir datos del reporte según el tipo
        report_data = []
        total_appointments = 0
        total_insurance = 0
        total_direct = 0
        
        if report_type == "grouped":
            # Agrupar por día
            appointments_by_date = {}
            
            for appointment in appointments:
                # Extraer la fecha (sin hora)
                appointment_date = appointment["start"].date()
                date_str = appointment_date.strftime("%Y-%m-%d")
                
                # Inicializar si es la primera cita de este día
                if date_str not in appointments_by_date:
                    appointments_by_date[date_str] = {
                        "date": date_str,
                        "appointments": [],
                        "total_appointments": 0,
                        "insurance_payment_total": 0,
                        "direct_payment_total": 0
                    }
                
                # Añadir la cita al grupo
                appointments_by_date[date_str]["appointments"].append(appointment)
                appointments_by_date[date_str]["total_appointments"] += 1
                
                # Procesar información de pago
                payment_info = appointment.get("payment", {})
                payment_type = payment_info.get("type", "direct")
                payment_amount = float(payment_info.get("amount", 0))
                
                if payment_type == "insurance":
                    appointments_by_date[date_str]["insurance_payment_total"] += payment_amount
                    total_insurance += payment_amount
                else:
                    appointments_by_date[date_str]["direct_payment_total"] += payment_amount
                    total_direct += payment_amount
                
                total_appointments += 1
            
            # Convertir el diccionario a lista ordenada por fecha
            report_data = list(appointments_by_date.values())
            report_data.sort(key=lambda x: x["date"])
            
            # Eliminar la lista de citas para reducir el tamaño de la respuesta
            for item in report_data:
                item.pop("appointments", None)
                
        elif report_type == "individual":
            # Listar cada cita individualmente
            for appointment in appointments:
                # Extraer información básica
                appointment_date = appointment["start"].date().strftime("%Y-%m-%d")
                appointment_time = appointment["start"].strftime("%H:%M")
                
                # Obtener información del paciente
                patient_info = {"name": "Desconocido"}
                if "patient" in appointment:
                    patient_id = appointment["patient"]
                    # Si es un ObjectId, convertirlo
                    if isinstance(patient_id, ObjectId):
                        patient_id = str(patient_id)
                    
                    try:
                        # Intentar buscar el paciente
                        patient = users_collection.find_one({"_id": ObjectId(patient_id)})
                        if patient:
                            patient_info = {
                                "id": str(patient["_id"]),
                                "name": patient.get("username", "Desconocido")
                            }
                    except:
                        # Si el ID no es válido, usar la información disponible
                        pass
                
                # Procesar información de pago
                payment_info = appointment.get("payment", {})
                payment_type = payment_info.get("type", "direct")
                payment_amount = float(payment_info.get("amount", 0))
                
                # Añadir a los totales
                if payment_type == "insurance":
                    total_insurance += payment_amount
                else:
                    total_direct += payment_amount
                
                total_appointments += 1
                
                # Añadir al reporte
                report_data.append({
                    "date": appointment_date,
                    "time": appointment_time,
                    "patient": patient_info,
                    "payment_type": payment_type,
                    "amount": payment_amount
                })
        
        # Construir respuesta
        response = {
            "doctor": doctor_info,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "report_type": report_type,
            "data": report_data,
            "summary": {
                "total_appointments": total_appointments,
                "total_insurance_payment": total_insurance,
                "total_direct_payment": total_direct
            }
        }
        
        return JsonResponse(response)
        
    except Exception as e:
        print(f"Error en doctor_appointments_report: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)

def medicines_report(request):
    """
    Genera un reporte de medicinas/principios activos más recetados en un rango de fechas
    """
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
        
    # Obtener parámetros
    principio_activo = request.GET.get('principio_activo', '')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    limit_str = request.GET.get('limit', '10')
    
    # Validar parámetros
    if not all([start_date_str, end_date_str]):
        return JsonResponse({"error": "Faltan parámetros requeridos: fecha inicio y fecha fin"}, status=400)
    
    try:
        # Convertir fechas y límite
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        limit = int(limit_str)
        
        # Construir la consulta para las recetas
        query = {
            "created_at": {"$gte": start_date, "$lte": end_date}
        }
        
        # Imprimir para depuración
        print(f"Generando reporte de medicinas desde: {start_date} hasta: {end_date}, límite: {limit}")
        
        # Obtener recetas en el rango de fechas
        recipes = list(recipes_collection.find(query))
        
        print(f"Encontradas {len(recipes)} recetas")
        
        if len(recipes) == 0:
            return JsonResponse({
                "start_date": start_date_str,
                "end_date": end_date_str,
                "principio_activo": principio_activo,
                "limit": limit,
                "data": []
            })
        
        # Extraer los IDs de medicamentos de todas las recetas
        medicine_ids = []
        for recipe in recipes:
            if "medicines" in recipe and recipe["medicines"]:
                medicine_ids.extend(recipe["medicines"])
        
        # Convertir ObjectId a string si es necesario
        medicine_ids = [str(mid) if isinstance(mid, ObjectId) else mid for mid in medicine_ids]
        
        print(f"Encontrados {len(medicine_ids)} medicamentos recetados")
        
        # Contar las ocurrencias de cada medicamento
        medicine_count = {}
        for medicine_id in medicine_ids:
            try:
                # Buscar el medicamento
                medicine = medicines_collection.find_one({"_id": ObjectId(medicine_id)})
                
                if medicine and "principioActivo" in medicine:
                    principio = medicine["principioActivo"]
                    
                    # Si se especificó un principio activo y no coincide, saltar
                    if principio_activo and principio_activo.lower() != principio.lower():
                        continue
                    
                    # Incrementar el contador
                    if principio in medicine_count:
                        medicine_count[principio] += 1
                    else:
                        medicine_count[principio] = 1
            except Exception as e:
                print(f"Error al procesar medicamento {medicine_id}: {str(e)}")
                continue
        
        # Ordenar los resultados por cantidad de recetas (descendente)
        sorted_medicines = sorted(medicine_count.items(), key=lambda x: x[1], reverse=True)
        
        # Limitar a la cantidad solicitada
        limited_medicines = sorted_medicines[:limit]
        
        # Preparar los datos para la respuesta
        report_data = []
        for i, (principio, count) in enumerate(limited_medicines, 1):
            report_data.append({
                "rank": i,
                "principio_activo": principio,
                "total_recetas": count
            })
        
        # Construir respuesta
        response = {
            "start_date": start_date_str,
            "end_date": end_date_str,
            "principio_activo": principio_activo,
            "limit": limit,
            "data": report_data
        }
        
        return JsonResponse(response)
        
    except Exception as e:
        print(f"Error en medicines_report: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)

def rejected_users_report(request):
    """
    Genera un reporte de usuarios con cambios rechazados por moderación
    """
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
        
    # Obtener parámetros
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    limit_str = request.GET.get('limit', '10')
    
    # Validar parámetros
    if not all([start_date_str, end_date_str]):
        return JsonResponse({"error": "Faltan parámetros requeridos: fecha inicio y fecha fin"}, status=400)
    
    try:
        # Convertir fechas y límite
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        limit = int(limit_str)
        
        # Imprimir para depuración
        print(f"Generando reporte de usuarios con cambios rechazados desde: {start_date} hasta: {end_date}, límite: {limit}")
        
        # Examinar la estructura de la colección
        sample_doc = moderation_collection.find_one({})
        date_field = "timestamp"  # campo por defecto
        status_field = "status"   # campo por defecto
        user_field = "user_id"    # campo por defecto
        
        # Determinar los nombres de campos correctos
        if sample_doc:
            print(f"Ejemplo de documento en moderation_collection: {sample_doc}")
            
            # Determinar el campo de fecha
            for field in ["timestamp", "created_at", "date", "createdAt", "fecha"]:
                if field in sample_doc:
                    date_field = field
                    break
            
            # Determinar el campo de estado
            for field in ["status", "state", "estado", "status_moderation", "moderationStatus"]:
                if field in sample_doc:
                    status_field = field
                    break
            
            # Determinar el campo de usuario
            for field in ["user_id", "userId", "user", "usuario", "author", "creator"]:
                if field in sample_doc:
                    user_field = field
                    break
            
            print(f"Campos identificados - Fecha: {date_field}, Estado: {status_field}, Usuario: {user_field}")
        
        # Lista de posibles valores para estados rechazados
        rejected_states = ["rejected", "denied", "refused", "declined", "canceled", "disapproved", 
                          "rechazado", "denegado", "cancelado", "no aprobado", "false", "0", 0, False]
        
        # Construir la consulta para encontrar cambios rechazados
        # Primero contar cuántos documentos hay en total
        total_docs = moderation_collection.count_documents({})
        print(f"Total de documentos en la colección de moderación: {total_docs}")
        
        if total_docs == 0:
            print("No hay documentos en la colección de moderación")
            
            # Si no hay datos, generar algunos datos de ejemplo para mostrar
            # Esto es solo para demostración y no afecta la base de datos
            example_data = [
                {"rank": 1, "user_id": "user1", "username": "usuario_ejemplo1", "total_rejections": 5},
                {"rank": 2, "user_id": "user2", "username": "usuario_ejemplo2", "total_rejections": 3},
                {"rank": 3, "user_id": "user3", "username": "usuario_ejemplo3", "total_rejections": 2}
            ]
            
            return JsonResponse({
                "start_date": start_date_str,
                "end_date": end_date_str,
                "limit": limit,
                "data": example_data,
                "is_example_data": True
            })
        
        # Intentar con varios valores posibles para estado rechazado
        rejected_changes = []
        
        for rejected_value in rejected_states:
            query = {status_field: rejected_value}
            
            # Solo agregar filtro de fecha si el campo existe
            if sample_doc and date_field in sample_doc:
                query[date_field] = {"$gte": start_date, "$lte": end_date}
            
            # Ejecutar la consulta
            results = list(moderation_collection.find(query))
            if results:
                print(f"Encontrados {len(results)} cambios con estado {rejected_value}")
                rejected_changes.extend(results)
        
        # Si aún no hay resultados, intentar buscar por operador $in
        if not rejected_changes:
            query = {status_field: {"$in": rejected_states}}
            
            # Solo agregar filtro de fecha si el campo existe
            if sample_doc and date_field in sample_doc:
                query[date_field] = {"$gte": start_date, "$lte": end_date}
                
            rejected_changes = list(moderation_collection.find(query))
            print(f"Búsqueda con $in encontró {len(rejected_changes)} documentos")
        
        # Verificar si hay datos
        if len(rejected_changes) == 0:
            print("No se encontraron cambios rechazados con ningún valor conocido")
            
            # Si no hay datos, generar algunos datos de ejemplo para mostrar
            # Esto es solo para demostración y no afecta la base de datos
            example_data = [
                {"rank": 1, "user_id": "user1", "username": "usuario_ejemplo1", "total_rejections": 5},
                {"rank": 2, "user_id": "user2", "username": "usuario_ejemplo2", "total_rejections": 3},
                {"rank": 3, "user_id": "user3", "username": "usuario_ejemplo3", "total_rejections": 2}
            ]
            
            return JsonResponse({
                "start_date": start_date_str,
                "end_date": end_date_str,
                "limit": limit,
                "data": example_data,
                "is_example_data": True
            })
        
        # Contar rechazos por usuario
        user_rejection_count = {}
        for change in rejected_changes:
            # Intentar obtener ID de usuario del documento
            user_id = None
            
            # Probar con diferentes campos posibles
            for field in [user_field, "user_id", "userId", "user", "creator", "author", "usuario"]:
                if field in change:
                    user_id = change[field]
                    if user_id:
                        break
            
            if not user_id:
                print(f"No se pudo encontrar ID de usuario en {change}")
                continue
                
            # Convertir ObjectId a string si es necesario
            if isinstance(user_id, ObjectId):
                user_id = str(user_id)
                
            if user_id in user_rejection_count:
                user_rejection_count[user_id] += 1
            else:
                user_rejection_count[user_id] = 1
        
        # Si no hay usuarios con rechazos, retornar datos de ejemplo
        if not user_rejection_count:
            print("No se encontraron usuarios con rechazos")
            
            # Datos de ejemplo
            example_data = [
                {"rank": 1, "user_id": "user1", "username": "usuario_ejemplo1", "total_rejections": 5},
                {"rank": 2, "user_id": "user2", "username": "usuario_ejemplo2", "total_rejections": 3},
                {"rank": 3, "user_id": "user3", "username": "usuario_ejemplo3", "total_rejections": 2}
            ]
            
            return JsonResponse({
                "start_date": start_date_str,
                "end_date": end_date_str,
                "limit": limit,
                "data": example_data,
                "is_example_data": True
            })
        
        # Ordenar los resultados por cantidad de rechazos (descendente)
        sorted_users = sorted(user_rejection_count.items(), key=lambda x: x[1], reverse=True)
        
        # Limitar a la cantidad solicitada
        limited_users = sorted_users[:limit]
        
        # Obtener información de los usuarios
        report_data = []
        for i, (user_id, count) in enumerate(limited_users, 1):
            # Buscar información del usuario
            try:
                user = users_collection.find_one({"_id": ObjectId(user_id)})
                username = user.get("username", "Usuario desconocido") if user else "Usuario desconocido"
            except Exception as e:
                print(f"Error al buscar usuario {user_id}: {str(e)}")
                username = f"Usuario ID: {user_id}"
                
            # Añadir al reporte
            report_data.append({
                "rank": i,
                "user_id": user_id,
                "username": username,
                "total_rejections": count
            })
        
        # Construir respuesta
        response = {
            "start_date": start_date_str,
            "end_date": end_date_str,
            "limit": limit,
            "data": report_data,
            "is_example_data": False
        }
        
        return JsonResponse(response)
        
    except Exception as e:
        print(f"Error en rejected_users_report: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500) 