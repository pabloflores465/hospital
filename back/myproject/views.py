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

import json


# Conectar a MongoDB
MONGO_URI = "mongodb+srv://admin:123@cluster0.iuspf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["hospital_db"]
collection = db["Hospital"]



@csrf_exempt  # Desactiva CSRF temporalmente para pruebas (⚠️ Seguridad en producción)
def insertar_paciente(request):
    if request.method == "POST":
        try:
            # Obtener los datos del body de la petición
            data = json.loads(request.body)
            
            # Insertar en MongoDB
            resultado = collection.insert_one(data)

            # Responder con el ID del documento insertado
            return JsonResponse({"mensaje": "Paciente insertado correctamente", "id": str(resultado.inserted_id)}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
    

def obtener_Hospital(request):
    if request.method == "GET":
        try:
            # Obtener todos los documentos de la colección
            hospitales = list(collection.find({}, {"_id": 0}))  # Excluir el campo _id

            # Responder con la lista de hospitales
            return JsonResponse(hospitales, safe=False, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
    

class SendEmailAPIView(APIView):
    def post(self, request, format=None):
        subject = request.data.get('subject')
        message = request.data.get('message')
        recipient_list = request.data.get('recipient_list')  # Se espera una lista de correos

        if not subject or not message or not recipient_list:
            return Response(
                {'error': 'Faltan parámetros (subject, message o recipient_list)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,  # Asegúrate de tenerlo configurado en settings.py
                recipient_list,
                fail_silently=False,
            )
            return Response({'success': 'Correo enviado correctamente'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)