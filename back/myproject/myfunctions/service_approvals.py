from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson.objectid import ObjectId
import json
from pymongo import MongoClient
from .insurance_connection import call_insurance_api
from .settings import MONGODB_HOST, MONGODB_PORT, MONGODB_NAME
import traceback

# Conectar a MongoDB
client = MongoClient(MONGODB_HOST, MONGODB_PORT)
db = client[MONGODB_NAME]

class ObjectIdEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(ObjectIdEncoder, self).default(obj)

@csrf_exempt
def request_service_approval(request):
    """
    Solicita una aprobación de servicio médico al sistema de seguros
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar datos requeridos
            required_fields = ['userId', 'serviceId', 'patientId']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({"success": False, "message": f"Campo requerido: {field}"})
            
            # Obtener información del servicio desde MongoDB
            service_id = data['serviceId']
            service = db.medical_services.find_one({"_id": ObjectId(service_id)})
            
            if not service:
                return JsonResponse({"success": False, "message": "Servicio no encontrado"})
            
            # Obtener información del hospital
            hospital = db.hospital_info.find_one({})
            
            if not hospital:
                return JsonResponse({"success": False, "message": "Información del hospital no encontrada"})
            
            # Preparar la solicitud para el sistema de seguros
            insurance_request = {
                "userId": data['userId'],  # ID del usuario en el sistema de seguros
                "hospitalId": hospital.get('insurance_hospital_id'),  # ID del hospital en el sistema de seguros
                "serviceId": str(service['_id']),
                "serviceName": service['name'],
                "serviceDescription": service.get('description', ''),
                "serviceCost": float(service['price'])
            }
            
            # Enviar solicitud al sistema de seguros
            insurance_response = call_insurance_api('/service-approvals/request', 'POST', insurance_request)
            
            if insurance_response.get('success'):
                # Guardar la aprobación en la base de datos local
                approval_data = {
                    "insurance_approval_code": insurance_response['approvalCode'],
                    "insurance_approval_id": insurance_response['approvalId'],
                    "patient_id": data['patientId'],
                    "service_id": service_id,
                    "service_name": service['name'],
                    "service_cost": float(service['price']),
                    "covered_amount": float(insurance_response['coveredAmount']),
                    "patient_amount": float(insurance_response['patientAmount']),
                    "status": "APPROVED",
                    "approval_date": insurance_response['approvalDate'],
                    "has_prescription": False,
                    "prescription_id": None,
                    "prescription_total": None
                }
                
                approval_id = db.service_approvals.insert_one(approval_data).inserted_id
                
                # Agregar la aprobación al paciente
                db.patients.update_one(
                    {"_id": ObjectId(data['patientId'])},
                    {"$push": {"service_approvals": str(approval_id)}}
                )
                
                # Preparar respuesta
                response_data = insurance_response.copy()
                response_data["local_approval_id"] = str(approval_id)
                
                return JsonResponse(response_data)
            else:
                return JsonResponse(insurance_response)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

@csrf_exempt
def add_prescription_to_approval(request):
    """
    Agrega información de receta a una aprobación de servicio y solicita aprobación al seguro
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar datos requeridos
            required_fields = ['approvalId', 'medications', 'total']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({"success": False, "message": f"Campo requerido: {field}"})
            
            # Obtener la aprobación
            approval_id = data['approvalId']
            approval = db.service_approvals.find_one({"_id": ObjectId(approval_id)})
            
            if not approval:
                return JsonResponse({"success": False, "message": "Aprobación no encontrada"})
            
            # Verificar que la aprobación esté en estado APPROVED
            if approval['status'] != "APPROVED":
                return JsonResponse({
                    "success": False, 
                    "message": "La aprobación no está en estado válido para agregar receta"
                })
            
            # Crear la receta en la base de datos
            prescription_data = {
                "approval_id": approval_id,
                "patient_id": approval['patient_id'],
                "service_id": approval['service_id'],
                "medications": data['medications'],
                "total": float(data['total']),
                "status": "PENDING"
            }
            
            prescription_id = db.prescriptions.insert_one(prescription_data).inserted_id
            
            # Preparar la solicitud para el sistema de seguros
            insurance_request = {
                "approvalCode": approval['insurance_approval_code'],
                "prescriptionId": str(prescription_id),
                "prescriptionTotal": float(data['total'])
            }
            
            # Enviar solicitud al sistema de seguros
            insurance_response = call_insurance_api('/service-approvals/prescription', 'POST', insurance_request)
            
            # Actualizar la aprobación con la información de la receta
            update_data = {
                "has_prescription": True,
                "prescription_id": str(prescription_id),
                "prescription_total": float(data['total'])
            }
            
            # Si fue rechazada, actualizar el estado
            if not insurance_response.get('success'):
                update_data["status"] = "REJECTED"
                update_data["rejection_reason"] = insurance_response.get('rejectionReason', 'Receta rechazada por el seguro')
                
                # También actualizar el estado de la receta
                db.prescriptions.update_one(
                    {"_id": prescription_id},
                    {"$set": {"status": "REJECTED", "rejection_reason": update_data["rejection_reason"]}}
                )
            
            db.service_approvals.update_one(
                {"_id": ObjectId(approval_id)},
                {"$set": update_data}
            )
            
            # Preparar respuesta
            response_data = insurance_response.copy()
            response_data["prescription_id"] = str(prescription_id)
            
            return JsonResponse(response_data)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

@csrf_exempt
def check_approval_status(request, approval_code):
    """
    Verifica el estado de una aprobación en el sistema de seguros
    """
    if request.method == 'GET':
        try:
            # Consultar el estado en el sistema de seguros
            insurance_response = call_insurance_api(f'/service-approvals/check/{approval_code}', 'GET')
            
            if insurance_response.get('success'):
                # Buscar la aprobación en nuestra base de datos
                approval = db.service_approvals.find_one({"insurance_approval_code": approval_code})
                
                if approval:
                    # Agregar datos locales a la respuesta
                    insurance_response["local_approval_id"] = str(approval['_id'])
                    insurance_response["patient_id"] = approval['patient_id']
                    
                    if approval.get('prescription_id'):
                        insurance_response["local_prescription_id"] = approval['prescription_id']
                
                return JsonResponse(insurance_response)
            else:
                return JsonResponse(insurance_response)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

@csrf_exempt
def complete_service_approval(request, approval_id):
    """
    Marca una aprobación de servicio como completada
    """
    if request.method == 'PUT':
        try:
            # Obtener la aprobación
            approval = db.service_approvals.find_one({"_id": ObjectId(approval_id)})
            
            if not approval:
                return JsonResponse({"success": False, "message": "Aprobación no encontrada"})
            
            # Verificar que la aprobación esté en estado válido
            if approval['status'] != "APPROVED":
                return JsonResponse({
                    "success": False, 
                    "message": "La aprobación no está en estado válido para completarla"
                })
            
            # Solicitar al sistema de seguros marcar como completada
            insurance_response = call_insurance_api(
                f'/service-approvals/complete/{approval["insurance_approval_code"]}', 'PUT')
            
            if insurance_response.get('success'):
                # Actualizar el estado en la base de datos local
                db.service_approvals.update_one(
                    {"_id": ObjectId(approval_id)},
                    {"$set": {"status": "COMPLETED", "completed_date": insurance_response.get('completedDate')}}
                )
                
                # Si tiene receta, actualizar también su estado
                if approval.get('prescription_id'):
                    db.prescriptions.update_one(
                        {"_id": ObjectId(approval['prescription_id'])},
                        {"$set": {"status": "COMPLETED"}}
                    )
                
                # Preparar respuesta
                response_data = insurance_response.copy()
                response_data["local_approval_id"] = approval_id
                
                return JsonResponse(response_data)
            else:
                return JsonResponse(insurance_response)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

def get_patient_approvals(request, patient_id):
    """
    Obtiene todas las aprobaciones de un paciente
    """
    if request.method == 'GET':
        try:
            # Buscar todas las aprobaciones del paciente
            approvals = list(db.service_approvals.find({"patient_id": patient_id}))
            
            # Convertir ObjectId a string
            for approval in approvals:
                approval['_id'] = str(approval['_id'])
            
            return JsonResponse({"success": True, "approvals": approvals}, encoder=ObjectIdEncoder)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

@csrf_exempt
def update_approval_prescription(approval_code, prescription_id):
    """
    Actualiza una aprobación de servicio con el ID de la receta de farmacia
    """
    try:
        # Buscar la aprobación por código
        approval = db.service_approvals.find_one({"insurance_approval_code": approval_code})
        
        if not approval:
            return {"success": False, "message": "Aprobación no encontrada"}
        
        # Verificar que la aprobación esté en estado válido
        if approval['status'] != "APPROVED":
            return {
                "success": False, 
                "message": "La aprobación no está en estado válido para agregar receta"
            }
        
        # Actualizar la aprobación con la información de la receta
        db.service_approvals.update_one(
            {"insurance_approval_code": approval_code},
            {"$set": {
                "external_prescription_id": prescription_id,
                "has_prescription": True
            }}
        )
        
        return {
            "success": True,
            "message": "Aprobación actualizada correctamente",
            "local_approval_id": str(approval["_id"])
        }
                
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "message": str(e)} 