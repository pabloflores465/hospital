from django.http import JsonResponse
from bson import ObjectId
from .config import users_collection
from django.views.decorators.csrf import csrf_exempt
import traceback
from .convert_objectid import convert_objectid


def get_users(request):
    if request.method == "GET":
        try:
            users = list(users_collection.find({}))
            if users.get("profile"):
                users.pop("profile", None)
            return JsonResponse({"appointments": users}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def get_current_doctor(request):
    if request.method == "GET":
        try:
            # Aquí deberías obtener el ID del médico desde la sesión o token
            # Para pruebas, puedes usar un ID fijo o pasarlo como parámetro
            
            # Asumiendo que tienes un mecanismo para obtener el ID del usuario actual
            # Por ejemplo, a través de un token JWT almacenado en cookies o headers
            
            # Este es un ejemplo simplificado - ajusta según tu sistema de autenticación
            user_id = None
            
            # Si usas token JWT en Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                # Aquí decodificarías el token para obtener el user_id
                # user_id = decode_jwt_token(token)['user_id']
            
            # Si usas cookies
            elif request.COOKIES.get('user_id'):
                user_id = request.COOKIES.get('user_id')
            
            # Para pruebas, si no hay autenticación, puedes pasar el ID como parámetro
            elif request.GET.get('doctor_id'):
                user_id = request.GET.get('doctor_id')
            
            if not user_id:
                return JsonResponse({"error": "No se pudo identificar al doctor actual"}, status=401)
            
            # Buscar al doctor en la base de datos
            doctor = users_collection.find_one({"_id": ObjectId(user_id), "rol": "doctor"})
            
            if not doctor:
                return JsonResponse({"error": "Doctor no encontrado"}, status=404)
            
            # Convertir ObjectId a string y eliminar información sensible
            doctor = convert_objectid(doctor)
            doctor.pop("password", None)
            if "profile" in doctor:
                doctor.pop("profile", None)
            
            return JsonResponse({"doctor": doctor}, status=200)
            
        except Exception as e:
            traceback_str = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": traceback_str}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def get_patient_by_email(request):
    if request.method == "GET":
        try:
            email = request.GET.get('email')
            patient = users_collection.find_one({"email": email, "rol": "patient"})
            return JsonResponse({"patient": patient}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
