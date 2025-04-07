import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson.objectid import ObjectId
import traceback
from .db import db

# Base URL para la API de la farmacia
PHARMACY_BASE_URL = "http://localhost:8080/api"

class ObjectIdEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(ObjectIdEncoder, self).default(obj)

def call_pharmacy_api(endpoint, method='GET', data=None):
    """
    Realiza llamadas a la API de la farmacia
    
    Args:
        endpoint: El endpoint de la API (comenzando con /)
        method: Método HTTP (GET, POST, PUT, DELETE)
        data: Datos a enviar en el cuerpo de la solicitud (para POST/PUT)
        
    Returns:
        dict: La respuesta JSON de la API
    """
    url = f"{PHARMACY_BASE_URL}{endpoint}"
    
    try:
        headers = {'Content-Type': 'application/json'}
        
        # Preparar datos de la solicitud si se proporcionaron
        json_data = None
        if data is not None:
            json_data = json.dumps(data, cls=ObjectIdEncoder)
        
        # Ejecutar la solicitud con timeout
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, data=json_data, headers=headers, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, data=json_data, headers=headers, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            return {"success": False, "message": f"Método no soportado: {method}"}
            
        # Analizar la respuesta JSON
        if response.status_code >= 200 and response.status_code < 300:
            try:
                result = response.json()
                return result
            except ValueError:
                return {"success": False, "message": "Respuesta inválida de la farmacia"}
        else:
            try:
                error_json = response.json()
                error_json["success"] = False
                error_json["status_code"] = response.status_code
                return error_json
            except:
                return {
                    "success": False,
                    "message": f"Error HTTP: {response.status_code} - {response.reason}",
                    "status_code": response.status_code
                }
            
    except requests.RequestException as e:
        # Manejar errores de conexión
        return {
            "success": False,
            "message": f"Error al conectar con la farmacia: {str(e)}"
        }
    except Exception as e:
        # Manejar otros errores
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

@csrf_exempt
def send_prescription_to_pharmacy(request):
    """
    Envía una receta médica a la farmacia para su dispensación
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            required_fields = ['prescriptionId', 'userId']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({"success": False, "message": f"Campo requerido: {field}"})
            
            # Obtener datos de la receta
            prescription_id = data['prescriptionId']
            prescription = db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
            
            if not prescription:
                return JsonResponse({"success": False, "message": "Receta no encontrada"})
            
            # Obtener datos del paciente
            patient_id = prescription['patient_id']
            patient = db.patients.find_one({"_id": ObjectId(patient_id)})
            
            if not patient:
                return JsonResponse({"success": False, "message": "Paciente no encontrado"})
            
            # Obtener aprobación del servicio
            approval_id = prescription['approval_id']
            approval = db.service_approvals.find_one({"_id": ObjectId(approval_id)})
            
            if not approval:
                return JsonResponse({"success": False, "message": "Aprobación de servicio no encontrada"})
            
            # Verificar que la receta esté aprobada
            if prescription.get('status') != 'APPROVED':
                return JsonResponse({
                    "success": False, 
                    "message": "La receta no está aprobada para dispensación"
                })
            
            # Preparar datos para la farmacia
            pharmacy_request = {
                "prescriptionId": str(prescription["_id"]),
                "approvalCode": approval["insurance_approval_code"],
                "userId": data['userId'],
                "patientName": patient.get('name', ''),
                "patientId": str(patient["_id"]),
                "medications": prescription["medications"],
                "totalAmount": prescription["total"],
                "insuranceCoverage": approval["covered_amount"] / approval["service_cost"]
            }
            
            # Enviar a la farmacia
            pharmacy_response = call_pharmacy_api('/prescriptions/process', 'POST', pharmacy_request)
            
            if pharmacy_response.get('success'):
                # Actualizar el estado de la receta en nuestra base de datos
                db.prescriptions.update_one(
                    {"_id": ObjectId(prescription_id)},
                    {"$set": {"pharmacy_status": "SENT", "pharmacy_reference": pharmacy_response.get('referenceId')}}
                )
                
                # Actualizar también la aprobación
                db.service_approvals.update_one(
                    {"_id": ObjectId(approval_id)},
                    {"$set": {"prescription_status": "SENT_TO_PHARMACY"}}
                )
                
                return JsonResponse(pharmacy_response)
            else:
                return JsonResponse(pharmacy_response)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

@csrf_exempt
def check_prescription_status(request, reference_id):
    """
    Verifica el estado de una receta en la farmacia
    """
    if request.method == 'GET':
        try:
            # Consultar el estado en la farmacia
            pharmacy_response = call_pharmacy_api(f'/prescriptions/status/{reference_id}', 'GET')
            
            if pharmacy_response.get('success'):
                # Buscar la receta en nuestra base de datos
                prescription = db.prescriptions.find_one({"pharmacy_reference": reference_id})
                
                if prescription:
                    # Si el estado cambió, actualizarlo en nuestra base de datos
                    new_status = pharmacy_response.get('status')
                    if new_status and new_status != prescription.get('pharmacy_status'):
                        db.prescriptions.update_one(
                            {"_id": prescription["_id"]},
                            {"$set": {"pharmacy_status": new_status}}
                        )
                    
                    # Agregar datos locales a la respuesta
                    pharmacy_response["prescription_id"] = str(prescription["_id"])
                    
                return JsonResponse(pharmacy_response)
            else:
                return JsonResponse(pharmacy_response)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"}) 