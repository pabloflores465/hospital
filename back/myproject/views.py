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
            if existing_user and existing_user["validated"]:
                return JsonResponse({"mensaje": "El usuario ya existe"}, status=400)

            cantidad = paciente_collection.count_documents({})
            if cantidad == 0:
                data["rol"] = "admin"
                data["force_admin"] = True
            data["password"] = make_password(data["password"])
            data["validated"] = False
            code = random.randbytes(64).hex()
            data["validation_code"] = make_password(code)

            # Insertar en MongoDB
            if existing_user:
                resultado = paciente_collection.replace_one(
                    {"_id": existing_user["_id"]}, data
                )
                inserted = existing_user["_id"]
            else:
                resultado = paciente_collection.insert_one(data)
                inserted = resultado.inserted_id
            send_mail(
                f"Registro para {data['username']}",
                f"Se ha pedido un registro para el usuario {data['username']} con su correo. Si no ha sido usted, puede ignorar este correo.\n\nSi ha sido usted, haga click en el siguiente enlace para validar su cuenta: http://localhost:4200/validate?username={data['username']}&code={code}",
                settings.EMAIL_HOST_USER,  # Asegúrate de tenerlo configurado en settings.py
                [data["email"]],
                fail_silently=False,
            )

            # Responder con el ID del documento insertado
            return JsonResponse(
                {"mensaje": "Paciente insertado correctamente"}, status=201
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
                {"username": data["username"], "validated": True}
            )
            if resultado is None:
                return JsonResponse(
                    {"mensaje": "Usuario o contraseña incorrectos"}, status=401
                )
            if not check_password(data["password"], resultado["password"]):
                return JsonResponse(
                    {"mensaje": "Usuario o contraseña incorrectos"}, status=401
                )

            resultado["_id"] = str(resultado["_id"])
            del resultado["password"]
            del resultado["validated"]
            del resultado["validation_code"]

            if "profile" in resultado and isinstance(resultado["profile"], ObjectId):
                resultado["profile"] = str(resultado["profile"])

            return JsonResponse(
                {"mensaje": "Paciente identificado", "user": resultado}, status=200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def actualizar_paciente(request, user_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            if "_id" in data:
                del data["_id"]
            if "username" in data:
                del data["username"]
            if "password" in data:
                if data["password"] != "":
                    data["password"] = make_password(data["password"])
                else:
                    del data["password"]
            resultado = paciente_collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": data}
            )
            return JsonResponse(
                {"mensaje": "Paciente actualizado correctamente"}, status=200
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
