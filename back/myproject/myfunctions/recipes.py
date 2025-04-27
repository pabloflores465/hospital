from django.http import JsonResponse
from bson import ObjectId
from .config import recipes_collection, medicines_collection, users_collection
from .get_list import get_list
from copy import deepcopy
from .convert_objectid import convert_objectid
import traceback
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime
from django.conf import settings

def get_recipes(request):
    if request.method == "GET":
        try:
            # Obtener el nombre de usuario de los parámetros de la URL
            username = request.GET.get('username')
            
            medicines = []
            recipes = []
            users = []
            
            if not medicines:
                get_list(medicines, medicines_collection)
            if not recipes:
                get_list(recipes, recipes_collection)
            if not users:
                get_list(users, users_collection)

            # Si se proporciona un nombre de usuario, filtrar las recetas
            if username:
                # Primero encontrar el ID del usuario por su nombre de usuario
                user = users_collection.find_one({"username": username})
                if user:
                    user_id = user["_id"]
                    # Filtrar recetas por el ID del usuario
                    recipes = [recipe for recipe in recipes if recipe.get("patient") == str(user_id)]
                else:
                    return JsonResponse({"error": "Usuario no encontrado"}, status=404)

            doctors = []
            for user in users:
                if user["rol"] == "doctor":
                    doctors.append(user)

            patients = []
            for user in users:
                if user["rol"] == "paciente":
                    patients.append(user)

            recipes_medicines = deepcopy(recipes)
            for recipe in recipes_medicines:
                if "medicines" in recipe:
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine_object = medicine_id
                        for medicine in medicines:
                            if "_id" in medicine and medicine_id == medicine.get("_id"):
                                medicine_object = medicine
                                recipe["medicines"][index] = medicine_object

            for recipe in recipes_medicines:
                code_string = ""
                for code in recipe["code"]:
                    code_string = f"{code_string}-{code}"
                recipe["code"] = code_string[1:]

                # Verificar si hay un paciente asociado y convertir su ID a string
                patient = users_collection.find_one({"_id": ObjectId(recipe["patient"])})
                if patient:
                    patient["_id"] = str(patient["_id"])
                    if patient.get("profile"):
                        patient.pop("profile", None)
                else:
                    recipe["patient"] = {}
                recipe["patient"] = patient

            return JsonResponse({"recipes": recipes_medicines}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def get_recipes_by_patient_id(request, user_id):
    if request.method == "GET":
        try:
            recipes = []

            # Buscar todas las recetas del paciente
            # Usar sort por created_at para ordenar en MongoDB
            cursor = recipes_collection.find({"patient": ObjectId(user_id)}).sort("created_at", -1)
            
            for doc in cursor:
                doc = convert_objectid(doc)
                recipes.append(doc)

            # Enriquecer cada receta con información detallada
            for recipe in recipes:
                # Obtener detalles de los medicamentos
                if recipe.get("medicines"):
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine = medicines_collection.find_one(
                            {"_id": ObjectId(medicine_id)}
                        )
                        if medicine:
                            medicine = convert_objectid(medicine)
                            recipe["medicines"][index] = medicine

                # Obtener datos del doctor
                if recipe.get("doctor"):
                    doctor = users_collection.find_one(
                        {"_id": ObjectId(recipe["doctor"])}
                    )
                    if doctor:
                        doctor = convert_objectid(doctor)
                        doctor.pop("password", None)
                        if doctor.get("profile"):
                            doctor.pop("profile", None)
                        recipe["doctor_details"] = doctor
                        # Mantener la compatibilidad con el código anterior
                        recipe["doctor"] = doctor["username"]

                # Formatear el código de la receta
                if "code" in recipe:
                    code_string = "-".join(recipe["code"])
                    recipe["formatted_code"] = code_string
                    # Mantener la compatibilidad con el código anterior
                    recipe["code"] = code_string

                # Agregar formato legible para created_at
                if "created_at" in recipe:
                    recipe["formatted_date"] = recipe["created_at"].strftime("%d/%m/%Y %H:%M:%S")

            # Obtener datos del paciente (solo una vez)
            patient = users_collection.find_one({"_id": ObjectId(user_id)})
            if patient:
                patient = convert_objectid(patient)
                patient.pop("password", None)
                if patient.get("profile"):
                    patient.pop("profile", None)
                
                # Añadir el paciente a la respuesta
                return JsonResponse({
                    "patient": patient,
                    "recipes": recipes
                }, status=200)
            else:
                return JsonResponse({"error": "Paciente no encontrado"}, status=404)
                
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def get_recipes_by_doctor_id(request, user_id):
    if request.method == "GET":
        try:
            recipes = []

            if not recipes:
                cursor = recipes_collection.find({"doctor": ObjectId(user_id)})
                for doc in cursor:
                    doc = convert_objectid(doc)
                    recipes.append(doc)

            for recipe in recipes:

                if recipe.get("medicines"):
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine = medicines_collection.find_one(
                            {"_id": ObjectId(medicine_id)}
                        )
                        medicine = convert_objectid(medicine)
                        if medicine:
                            recipe["medicines"][index] = medicine

                if recipe.get("doctor"):
                    doctor = users_collection.find_one(
                        {"_id": ObjectId(recipe["doctor"])}
                    )
                    if doctor:
                        recipe["doctor"] = doctor["username"]

                code_string = ""
                for code in recipe["code"]:
                    code_string = f"{code_string}-{code}"
                recipe["code"] = code_string[1:]

                # Verificar si hay un paciente asociado y convertir su ID a string
                patient = users_collection.find_one({"_id": ObjectId(recipe["patient"])})
                if patient:
                    patient["_id"] = str(patient["_id"])
                    if patient.get("profile"):
                        patient.pop("profile", None)
                else:
                    recipe["patient"] = {}
                recipe["patient"] = patient

            return JsonResponse({"recipes": recipes}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

def get_recipes_by_email(request, email):
    if request.method == "GET":
        try:
            # Buscar el usuario por su email
            user = users_collection.find_one({"email": email})
            if not user:
                return JsonResponse({"error": "Usuario no encontrado con ese email"}, status=404)
            
            user_id = user["_id"]
            recipes = []

            # Buscar todas las recetas del paciente
            # Usar sort por created_at para ordenar en MongoDB
            cursor = recipes_collection.find({"patient": user_id}).sort("created_at", -1)
            
            for doc in cursor:
                doc = convert_objectid(doc)
                recipes.append(doc)

            # Enriquecer cada receta con información detallada
            for recipe in recipes:
                # Obtener detalles de los medicamentos
                if recipe.get("medicines"):
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine = medicines_collection.find_one(
                            {"_id": ObjectId(medicine_id)}
                        )
                        if medicine:
                            medicine = convert_objectid(medicine)
                            recipe["medicines"][index] = medicine

                # Obtener datos del doctor
                if recipe.get("doctor"):
                    doctor = users_collection.find_one(
                        {"_id": ObjectId(recipe["doctor"])}
                    )
                    if doctor:
                        doctor = convert_objectid(doctor)
                        doctor.pop("password", None)
                        if doctor.get("profile"):
                            doctor.pop("profile", None)
                        recipe["doctor_details"] = doctor
                        # Mantener la compatibilidad con el código anterior
                        recipe["doctor"] = doctor["username"]

                # Formatear el código de la receta
                if "code" in recipe:
                    code_string = "-".join(recipe["code"])
                    recipe["formatted_code"] = code_string
                    # Mantener la compatibilidad con el código anterior
                    recipe["code"] = code_string

                # Agregar formato legible para created_at
                if "created_at" in recipe:
                    recipe["formatted_date"] = recipe["created_at"].strftime("%d/%m/%Y %H:%M:%S")

            # Obtener datos del paciente (solo una vez)
            user = convert_objectid(user)
            user.pop("password", None)
            if user.get("profile"):
                user.pop("profile", None)
            
            # Añadir el paciente a la respuesta
            return JsonResponse({
                "patient": user,
                "recipes": recipes
            }, status=200)
            
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def save_recipe(request):
    if request.method == "POST":
        try:
            # Obtener los datos de la solicitud
            data = json.loads(request.body)
            
            # Validar que estén todos los campos necesarios
            required_fields = ["paciente", "nombreMedico"]
            for field in required_fields:
                if field not in data:
                    return JsonResponse({"error": f"Falta el campo requerido: {field}"}, status=400)
            
            # Verificar que exista al menos un medicamento
            if "medicamento" not in data and ("medicamentos" not in data or not data["medicamentos"]):
                return JsonResponse({"error": "Debe proporcionar al menos un medicamento"}, status=400)
            
            # Convertir IDs a ObjectId
            doctor_id = ObjectId(data["nombreMedico"])
            patient_id = ObjectId(data["paciente"])
            
            # Crear código de receta
            codigo = []
            codigo.append(data.get("codigoHospital", "00000"))
            
            # Si tiene seguro, agregar el código de seguro
            if data.get("tieneSeguro") and "codigoSeguro" in data:
                codigo.append(data["codigoSeguro"])
            
            # Agregar la fecha actual como parte del código (yyyymmdd)
            current_date = datetime.now().strftime("%Y%m%d")
            codigo.append(current_date)
            
            # Generar un número aleatorio como parte final del código
            import random
            random_part = str(random.randint(1000, 9999))
            codigo.append(random_part)
            
            # Lista para guardar los IDs de los medicamentos
            medicine_ids = []
            
            # Procesar los medicamentos (ya sea un medicamento único o un array)
            medicamentos_a_procesar = []
            
            if "medicamentos" in data and isinstance(data["medicamentos"], list) and len(data["medicamentos"]) > 0:
                # Si hay un array de medicamentos, usamos ese
                medicamentos_a_procesar = data["medicamentos"]
            elif "medicamento" in data:
                # Si solo hay un medicamento, lo convertimos en lista
                medicamentos_a_procesar = [data["medicamento"]]
            
            # Guardar cada medicamento
            for medicamento in medicamentos_a_procesar:
                # Crear objeto de medicamento para guardar
                medicine_data = {
                    "principioActivo": medicamento["principioActivo"],
                    "concentracion": medicamento["concentracion"],
                    "presentacion": medicamento["presentacion"],
                    "formaFarmaceutica": medicamento["formaFarmaceutica"],
                    "dosis": medicamento["dosis"],
                    "frecuencia": medicamento["frecuencia"],
                    "duracion": medicamento["duracion"],
                    "diagnostico": medicamento["diagnostico"],
                    "precio": medicamento.get("precio", 0)
                }
                
                # Añadir campos de estimación si están presentes
                if "unidadesPorPaquete" in medicamento:
                    medicine_data["unidadesPorPaquete"] = medicamento["unidadesPorPaquete"]
                if "estimadoUnidades" in medicamento:
                    medicine_data["estimadoUnidades"] = medicamento["estimadoUnidades"]
                if "estimadoPaquetes" in medicamento:
                    medicine_data["estimadoPaquetes"] = medicamento["estimadoPaquetes"]
                if "costoEstimado" in medicamento:
                    medicine_data["costoEstimado"] = medicamento["costoEstimado"]
                if "stockDisponible" in medicamento:
                    medicine_data["stockDisponible"] = medicamento["stockDisponible"]
                
                # Insertar el medicamento
                medicine_id = medicines_collection.insert_one(medicine_data).inserted_id
                # Añadir el ID a la lista
                medicine_ids.append(str(medicine_id))
            
            # Crear objeto de receta para guardar
            recipe_data = {
                "patient": patient_id,
                "doctor": doctor_id,
                "medicines": medicine_ids,  # Lista de IDs de medicamentos
                "code": codigo,
                "has_insurance": data.get("tieneSeguro", False),
                "insurance_code": data.get("codigoSeguro", ""),
                "special_notes": data.get("notasEspeciales", ""),
                "created_at": datetime.now()
            }
            
            # Agregar appointmentId si está presente en los datos
            if "appointmentId" in data and data["appointmentId"]:
                try:
                    # Intentar convertir a ObjectId si es una cadena válida
                    appointment_id = ObjectId(data["appointmentId"])
                    recipe_data["appointment_id"] = appointment_id
                except:
                    # Si no es un ObjectId válido, guardarlo como string
                    recipe_data["appointment_id"] = data["appointmentId"]
            
            # Agregar información de diagnóstico de la cita si está presente
            if "diagnosis" in data:
                recipe_data["diagnosis"] = data["diagnosis"]
            if "exams" in data:
                recipe_data["exams"] = data["exams"]
            if "next_steps" in data:
                recipe_data["next_steps"] = data["next_steps"]
            
            # Agregar información de costos si está disponible
            if "subtotal" in data:
                recipe_data["subtotal"] = data["subtotal"]
            if "porcentajeDescuento" in data:
                recipe_data["porcentajeDescuento"] = data["porcentajeDescuento"]
            elif "tieneSeguro" in data and data["tieneSeguro"]:
                # Valor por defecto si tiene seguro pero no se especificó el porcentaje
                recipe_data["porcentajeDescuento"] = 15
            if "descuento" in data:
                recipe_data["descuento"] = data["descuento"]
            if "totalConDescuento" in data:
                recipe_data["totalConDescuento"] = data["totalConDescuento"]
            
            # Insertar la receta
            recipe_id = recipes_collection.insert_one(recipe_data).inserted_id
            
            # Formatear el código para la respuesta
            code_string = "-".join(codigo)
            
            return JsonResponse({
                "success": True,
                "message": "Receta guardada correctamente",
                "recipe_id": str(recipe_id),
                "code": code_string,
                "total_medicines": len(medicine_ids)
            }, status=201)
            
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

def get_recipe_detail(request, recipe_id):
    if request.method == "GET":
        try:
            # Buscar la receta por su ID
            recipe = recipes_collection.find_one({"_id": ObjectId(recipe_id)})
            
            if not recipe:
                return JsonResponse({"error": "Receta no encontrada"}, status=404)
            
            # Convertir ObjectId a string
            recipe = convert_objectid(recipe)
            
            # Obtener detalles de los medicamentos
            if "medicines" in recipe:
                for index, medicine_id in enumerate(recipe["medicines"]):
                    medicine = medicines_collection.find_one({"_id": ObjectId(medicine_id)})
                    if medicine:
                        medicine = convert_objectid(medicine)
                        recipe["medicines"][index] = medicine
            
            # Obtener datos del doctor
            if "doctor" in recipe:
                doctor = users_collection.find_one({"_id": ObjectId(recipe["doctor"])})
                if doctor:
                    # Eliminar campos sensibles del doctor
                    doctor = convert_objectid(doctor)
                    if "password" in doctor:
                        doctor.pop("password", None)
                    if "profile" in doctor:
                        doctor.pop("profile", None)
                    recipe["doctor_details"] = doctor
            
            # Obtener datos del paciente
            if "patient" in recipe:
                patient = users_collection.find_one({"_id": ObjectId(recipe["patient"])})
                if patient:
                    # Eliminar campos sensibles del paciente
                    patient = convert_objectid(patient)
                    if "password" in patient:
                        patient.pop("password", None)
                    if "profile" in patient:
                        patient.pop("profile", None)
                    recipe["patient_details"] = patient
            
            # Formatear el código de la receta
            if "code" in recipe:
                code_string = "-".join(recipe["code"])
                recipe["formatted_code"] = code_string
            
            # Agregar formato legible para created_at
            if "created_at" in recipe:
                recipe["formatted_date"] = recipe["created_at"].strftime("%d/%m/%Y %H:%M:%S")
            
            return JsonResponse({"recipe": recipe}, status=200)
            
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def send_recipe_by_email(request, recipe_id):
    if request.method == "POST":
        try:
            # Obtener la receta
            recipe = recipes_collection.find_one({"_id": ObjectId(recipe_id)})
            if not recipe:
                return JsonResponse({"error": "Receta no encontrada"}, status=404)
            
            # Convertir ObjectId a string
            recipe = convert_objectid(recipe)
            
            # Obtener detalles del paciente
            patient = users_collection.find_one({"_id": ObjectId(recipe["patient"])})
            if not patient:
                return JsonResponse({"error": "Paciente no encontrado"}, status=404)
            
            # Verificar que el paciente tiene correo
            if "email" not in patient or not patient["email"]:
                return JsonResponse({"error": "El paciente no tiene correo electrónico registrado"}, status=400)
            
            patient_email = patient["email"]
            
            # Obtener detalles del médico
            doctor = users_collection.find_one({"_id": ObjectId(recipe["doctor"])})
            if not doctor:
                return JsonResponse({"error": "Médico no encontrado"}, status=404)
            
            # Obtener detalles de los medicamentos
            medicines = []
            total_cost = 0
            if "medicines" in recipe:
                for medicine_id in recipe["medicines"]:
                    medicine = medicines_collection.find_one({"_id": ObjectId(medicine_id)})
                    if medicine:
                        medicine = convert_objectid(medicine)
                        medicines.append(medicine)
                        
                        # Calcular costo si está disponible
                        if "precio" in medicine and medicine["precio"]:
                            try:
                                price = float(medicine["precio"])
                                total_cost += price
                            except (ValueError, TypeError):
                                pass
            
            # Calcular descuento si aplica
            discount = 0
            discount_percentage = 0
            total_with_discount = total_cost
            
            if recipe.get("has_insurance", False) and recipe.get("porcentajeDescuento"):
                try:
                    discount_percentage = float(recipe["porcentajeDescuento"])
                    discount = total_cost * (discount_percentage / 100)
                    total_with_discount = total_cost - discount
                except (ValueError, TypeError):
                    pass
            
            # Formatear el código de la receta
            code_string = "-".join(recipe["code"]) if "code" in recipe else ""
            
            # Crear el contenido del correo
            subject = f"Receta Médica - Código: {code_string}"
            
            # Construir el cuerpo del correo - usamos texto plano para evitar problemas de codificación
            message_plain = f"Estimado/a {patient.get('username', 'Paciente')}:\n\n"
            message_plain += f"Le enviamos su receta médica con fecha {datetime.now().strftime('%d/%m/%Y')}.\n\n"
            message_plain += "DATOS DE LA RECETA:\n"
            message_plain += f"Código: {code_string}\n"
            message_plain += f"Médico: {doctor.get('username', 'Médico')}\n"
            message_plain += f"Especialidad: {doctor.get('especialidad', 'Medicina General')}\n"
            message_plain += f"Número de Colegiado: {doctor.get('noLicencia', 'N/A')}\n"
            
            # Agregar información del seguro solo si el paciente tiene seguro
            if recipe.get("has_insurance", False) and recipe.get("insurance_code"):
                message_plain += f"Número de Seguro: {recipe.get('insurance_code', 'N/A')}\n"
            
            message_plain += "\nMEDICAMENTOS EN ESTA RECETA:\n"
            for idx, med in enumerate(medicines, 1):
                message_plain += f"\n{idx}. {med.get('principioActivo', 'N/A')} ({med.get('concentracion', 'N/A')})\n"
                message_plain += f"  Presentación API: {med.get('presentacion', 'N/A')} | Forma: {med.get('formaFarmaceutica', 'N/A')}\n"
                message_plain += f"  Dosis: {med.get('dosis', 'N/A')} | Frecuencia: {med.get('frecuencia', 'N/A')} | Duración: {med.get('duracion', 'N/A')}\n"
                
                # Información de unidades por paquete y precio
                unidades_paquete = med.get('unidadesPorPaquete', '??')
                precio = med.get('precio', 0)
                message_plain += f"  Precio Paquete ({unidades_paquete} u.): Q{precio:.2f}\n"
                
                # Información de estimados si está disponible
                if "estimadoUnidades" in med:
                    message_plain += f"  Total Unidades Estimado: {med.get('estimadoUnidades')} unidades\n"
                if "estimadoPaquetes" in med:
                    message_plain += f"  Total Paquetes Estimado: {med.get('estimadoPaquetes')}\n"
                if "costoEstimado" in med:
                    message_plain += f"  Costo Estimado Línea: Q{med.get('costoEstimado'):.2f}\n"
                
                message_plain += f"  Diagnóstico: {med.get('diagnostico', 'N/A')}\n"
            
            # Agregar resumen de costos
            message_plain += "\nRESUMEN DE COSTOS:\n"
            message_plain += f"Subtotal Medicamentos: Q{total_cost:.2f}\n"
            
            if discount > 0:
                message_plain += f"Descuento por Póliza ({discount_percentage}%): -Q{discount:.2f}\n"
            
            message_plain += f"TOTAL A PAGAR: Q{total_with_discount:.2f}\n\n"
            
            if "special_notes" in recipe and recipe["special_notes"]:
                message_plain += "NOTAS ESPECIALES:\n"
                message_plain += f"{recipe['special_notes']}\n\n"
            
            message_plain += "Atentamente,\nHospital App"
            
            # Enviar el correo utilizando EmailMessage para asegurarnos del manejo correcto de la codificación
            from django.core.mail import EmailMessage
            
            email = EmailMessage(
                subject,
                message_plain,
                to=[patient_email],
                from_email=settings.EMAIL_HOST_USER
            )
            
            # Forzar codificación UTF-8
            email.encoding = 'utf-8'
            email.send(fail_silently=False)
            
            return JsonResponse({
                "success": True,
                "message": f"Receta enviada a {patient_email}"
            }, status=200)
        
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
