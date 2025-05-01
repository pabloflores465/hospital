import random
from bson import ObjectId
from django.http import JsonResponse
from django.shortcuts import render
from pymongo import MongoClient
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from .myfunctions.convert_objectid import convert_objectid

import json

# Conectar a MongoDB
MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["hospital_db"]
paciente_collection = db["users"]


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def registrar_paciente(request):
    if request.method == "POST":
        try:
            # Obtener los datos del body de la petición
            data = json.loads(request.body)

            existing_user = paciente_collection.find_one({"username": data["username"]})
            if existing_user:
                return JsonResponse({"mensaje": "El usuario ya existe"}, status=400)

            cantidad = paciente_collection.count_documents({})
            if cantidad == 0:
                data["rol"] = "admin"
                data["force_admin"] = True
                data["activated"] = True
            else:
                # Por defecto, el rol será 'pendiente' hasta que un admin lo active
                data["rol"] = "pendiente"
                data["activated"] = False
                
            data["password"] = make_password(data["password"])
            data["validated"] = True  # Ya no se usa validación por correo
            data["validation_code"] = None

            # Insertar en MongoDB
            if existing_user:
                resultado = paciente_collection.replace_one(
                    {"_id": existing_user["_id"]}, data
                )
                inserted = existing_user["_id"]
            else:
                resultado = paciente_collection.insert_one(data)
                inserted = resultado.inserted_id
            
            # Enviar correo de espera de validación por admin
            send_mail(
                f"Registro pendiente de activación - {data['username']}",
                f"Hola {data['username']},\n\nGracias por registrarte en nuestro sistema. Tu cuenta ha sido creada pero está pendiente de activación por un administrador.\n\nTe notificaremos por correo cuando tu cuenta sea activada y se te asigne un rol en el sistema.\n\nSaludos,\nEl equipo administrativo",
                settings.EMAIL_HOST_USER,
                [data["email"]],
                fail_silently=False,
            )

            # Responder con el ID del documento insertado
            return JsonResponse(
                {"mensaje": "Usuario registrado correctamente. En espera de activación por un administrador."}, status=201
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def validar_paciente(request):
    if request.method == "POST":
        try:
            # Obtener los datos del body de la petición
            data = json.loads(request.body)
            user = paciente_collection.find_one(
                {"username": data["username"], "validated": False}
            )
            if not user:
                return JsonResponse(
                    {
                        "mensaje": "No hay un usuario que se encuentre pendiente de validación"
                    },
                    status=400,
                )
            if not check_password(data["validation_code"], user["validation_code"]):
                return JsonResponse(
                    {"mensaje": "No se pudo validar el usuario"}, status=400
                )
            resultado = paciente_collection.update_one(
                {"username": data["username"]},
                {"$set": {"validation_code": None, "validated": True}},
            )

            return JsonResponse(
                {"mensaje": "Paciente validado correctamente"}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def insertar_paciente(request):
    if request.method == "POST":
        try:
            # Obtener los datos del body de la petición
            data = json.loads(request.body)

            existing_user = paciente_collection.find_one({"username": data["username"]})
            if existing_user:
                return JsonResponse({"mensaje": "El usuario ya existe"}, status=400)

            data["password"] = make_password(data["password"])
            data["validated"] = True
            data["validation_code"] = None

            resultado = paciente_collection.insert_one(data)

            return JsonResponse(
                {"mensaje": "Paciente insertado correctamente"}, status=201
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def login_paciente(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            resultado = paciente_collection.find_one(
                {"username": data["username"]}
            )
            if resultado is None:
                return JsonResponse(
                    {"mensaje": "Usuario o contraseña incorrectos"}, status=401
                )
            if not check_password(data["password"], resultado["password"]):
                return JsonResponse(
                    {"mensaje": "Usuario o contraseña incorrectos"}, status=401
                )
            
            # Verificar si la cuenta está activada
            if "activated" in resultado and not resultado["activated"]:
                return JsonResponse(
                    {"mensaje": "Tu cuenta está pendiente de activación por un administrador"}, status=401
                )

            resultado["_id"] = str(resultado["_id"])
            del resultado["password"]
            # Eliminar campos relacionados con la validación si existen
            if "validated" in resultado:
                del resultado["validated"]
            if "validation_code" in resultado:
                del resultado["validation_code"]

            if "profile" in resultado and isinstance(resultado["profile"], ObjectId):
                resultado["profile"] = str(resultado["profile"])

            return JsonResponse(
                {"mensaje": "Usuario identificado correctamente", "user": resultado}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def actualizar_paciente(request, user_id):
    if request.method == "PUT":
        try:
            # Obtener el usuario actual para verificar cambios
            usuario_actual = paciente_collection.find_one({"_id": ObjectId(user_id)})
            if not usuario_actual:
                return JsonResponse({"mensaje": "Usuario no encontrado"}, status=404)
                
            data = json.loads(request.body)
            
            # Guardar el rol anterior para comparar después
            rol_anterior = usuario_actual.get("rol", "")
            activated_anterior = usuario_actual.get("activated", False)
            
            # Campos que no se pueden actualizar directamente
            if "_id" in data:
                del data["_id"]
            if "username" in data:
                del data["username"]
                
            # Procesar password si se proporciona
            if "password" in data:
                if data["password"] != "":
                    data["password"] = make_password(data["password"])
                else:
                    del data["password"]
            
            # Actualizar usuario
            resultado = paciente_collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": data}
            )
            
            # Verificar si el rol o el estado de activación cambió
            if "rol" in data and data["rol"] != rol_anterior:
                # Enviar correo de notificación de cambio de rol
                send_mail(
                    f"Cambio de rol en tu cuenta - {usuario_actual['username']}",
                    f"Hola {usuario_actual['username']},\n\nTe informamos que tu rol en nuestro sistema ha sido actualizado de '{rol_anterior}' a '{data['rol']}'.\n\nCon este nuevo rol, tendrás acceso a diferentes funcionalidades del sistema.\n\nSaludos,\nEl equipo administrativo",
                    settings.EMAIL_HOST_USER,
                    [usuario_actual["email"]],
                    fail_silently=False,
                )
            
            # Verificar si se activó la cuenta
            if "activated" in data and data["activated"] and not activated_anterior:
                # Enviar correo de notificación de activación
                send_mail(
                    f"Tu cuenta ha sido activada - {usuario_actual['username']}",
                    f"Hola {usuario_actual['username']},\n\nNos complace informarte que tu cuenta en nuestro sistema ha sido activada. Ya puedes iniciar sesión y acceder a todas las funcionalidades disponibles.\n\nSaludos,\nEl equipo administrativo",
                    settings.EMAIL_HOST_USER,
                    [usuario_actual["email"]],
                    fail_silently=False,
                )
            
            return JsonResponse(
                {"mensaje": "Usuario actualizado correctamente"}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def borrar_paciente(request, user_id):
    if request.method == "DELETE":
        try:
            resultado = paciente_collection.delete_one({"_id": ObjectId(user_id)})
            return JsonResponse(
                {"mensaje": "Paciente borrado correctamente"}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def lista_pacientes(request):
    if request.method == "GET":
        try:
            patients = []
            for patient in paciente_collection.find({}):
                patient["_id"] = convert_objectid(patient["_id"])
                if "profile" in patient:
                    patient["profile"] = convert_objectid(patient["profile"])
                patients.append(patient)

            return JsonResponse(
                patients,
                safe=False,
                status=200,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def obtener_paciente(request, user_id):
    if request.method == "GET":
        try:
            # Obtener todos los documentos de la colección
            paciente = paciente_collection.find_one({"_id": ObjectId(user_id)})
            if paciente is None:
                return JsonResponse({"mensaje": "Paciente no encontrado"}, status=404)

            paciente["_id"] = str(paciente["_id"])
            # Responder con la lista de hospitales
            return JsonResponse(paciente, safe=False, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def obtener_recetas_usuario(request, user_id):
    if request.method == "GET":
        try:
            # Obtener las recetas del usuario específico
            recetas = list(db.recetas.find({"paciente": user_id}))
            
            # Convertir los ObjectId a string
            for receta in recetas:
                receta["_id"] = str(receta["_id"])
                if "paciente" in receta:
                    receta["paciente"] = str(receta["paciente"])
            
            return JsonResponse(recetas, safe=False, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def activar_usuario(request, user_id):
    if request.method == "POST":
        try:
            # Obtener el usuario
            user = paciente_collection.find_one({"_id": ObjectId(user_id)})
            if user is None:
                return JsonResponse({"mensaje": "Usuario no encontrado"}, status=404)
            
            # Activar el usuario
            rol_anterior = user.get("rol", "pendiente")
            resultado = paciente_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"activated": True}}
            )
            
            # Enviar correo de notificación
            send_mail(
                f"Tu cuenta ha sido activada - {user['username']}",
                f"Hola {user['username']},\n\nNos complace informarte que tu cuenta en nuestro sistema ha sido activada. Ya puedes iniciar sesión y acceder a todas las funcionalidades disponibles.\n\nSaludos,\nEl equipo administrativo",
                settings.EMAIL_HOST_USER,
                [user["email"]],
                fail_silently=False,
            )
            
            return JsonResponse(
                {"mensaje": "Usuario activado correctamente", "rol_anterior": rol_anterior}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
