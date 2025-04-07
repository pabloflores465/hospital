import json
import requests
from django.http import JsonResponse
from bson.objectid import ObjectId

# Base URL for insurance API
INSURANCE_BASE_URL = "http://localhost:8081/api"

class ObjectIdEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(ObjectIdEncoder, self).default(obj)

def call_insurance_api(endpoint, method='GET', data=None):
    """
    Makes API calls to the insurance service
    
    Args:
        endpoint: The API endpoint (starting with /)
        method: HTTP method (GET, POST, PUT, DELETE)
        data: Data to send in the request body (for POST/PUT)
        
    Returns:
        dict: The JSON response from the API
    """
    url = f"{INSURANCE_BASE_URL}{endpoint}"
    
    try:
        headers = {'Content-Type': 'application/json'}
        
        # Prepare request data if provided
        json_data = None
        if data is not None:
            json_data = json.dumps(data, cls=ObjectIdEncoder)
        
        # Execute request with timeout
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, data=json_data, headers=headers, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, data=json_data, headers=headers, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            return {"success": False, "message": f"Unsupported method: {method}"}
            
        # Parse JSON response
        if response.status_code >= 200 and response.status_code < 300:
            try:
                result = response.json()
                return result
            except ValueError:
                return {"success": False, "message": "Invalid response from insurance service"}
        else:
            try:
                error_json = response.json()
                error_json["success"] = False
                error_json["status_code"] = response.status_code
                return error_json
            except:
                return {
                    "success": False,
                    "message": f"HTTP Error: {response.status_code} - {response.reason}",
                    "status_code": response.status_code
                }
            
    except requests.RequestException as e:
        # Handle connection errors
        return {
            "success": False,
            "message": f"Error connecting to insurance service: {str(e)}"
        }
    except Exception as e:
        # Handle other errors
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

# Funciones específicas para integración con el seguro
def get_insurance_hospitals():
    """
    Obtiene la lista de hospitales registrados en el sistema de seguros
    """
    return call_insurance_api('/hospitals', 'GET')

def get_insurance_policies():
    """
    Obtiene la lista de pólizas de seguro disponibles
    """
    return call_insurance_api('/policies', 'GET')

def sync_services_with_insurance(request):
    """
    Sincroniza los servicios médicos con el sistema de seguros
    """
    if request.method == 'POST':
        try:
            # Obtener los servicios médicos del hospital
            data = json.loads(request.body)
            
            # Enviar al sistema de seguros
            response = call_insurance_api('/services/sync', 'POST', data)
            
            return JsonResponse(response)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"})

def check_service_coverage(request):
    """
    Verifica la cobertura de un servicio específico para un usuario del seguro
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            if 'serviceId' not in data or 'userId' not in data:
                return JsonResponse({"success": False, "message": "Se requieren serviceId y userId"})
            
            # Consultar al sistema de seguros
            response = call_insurance_api('/services/check-coverage', 'POST', data)
            
            return JsonResponse(response)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    
    return JsonResponse({"success": False, "message": "Método no permitido"}) 