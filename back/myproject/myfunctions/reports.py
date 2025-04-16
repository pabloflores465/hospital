from django.http import JsonResponse
from datetime import datetime
from bson import ObjectId
from .config import appointments_collection, users_collection
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
        
        # Enriquecer datos de las citas
        for appt in appointments:
            appt["_id"] = str(appt["_id"])
            
            # Convertir referencias a ObjectId en strings
            if isinstance(appt.get("doctor"), ObjectId):
                appt["doctor"] = str(appt["doctor"])
                
            # Obtener datos del paciente
            patient_data = {"id": "", "name": "Paciente desconocido"}
            
            if "patient" in appt:
                if isinstance(appt["patient"], ObjectId):
                    patient = users_collection.find_one({"_id": appt["patient"]})
                    if patient:
                        patient_data = {
                            "id": str(patient["_id"]),
                            "name": patient.get("username", "Paciente desconocido")
                        }
                elif isinstance(appt["patient"], str):
                    try:
                        patient_obj_id = ObjectId(appt["patient"])
                        patient = users_collection.find_one({"_id": patient_obj_id})
                        if patient:
                            patient_data = {
                                "id": str(patient["_id"]),
                                "name": patient.get("username", "Paciente desconocido")
                            }
                    except:
                        patient_data = {"id": appt["patient"], "name": "Paciente desconocido"}
                
                # Si patient es un diccionario, extraer datos directamente
                elif isinstance(appt["patient"], dict):
                    patient_data = {
                        "id": str(appt["patient"].get("_id", "")),
                        "name": appt["patient"].get("username", "Paciente desconocido")
                    }
            
            # Guardar datos del paciente para uso posterior
            appt["patient_data"] = patient_data
        
        # Generar datos según tipo de reporte
        report_data = []
        total_appointments = len(appointments)
        total_insurance = 0
        total_direct = 0
        
        if report_type == "grouped":
            # Agrupar por día
            date_groups = {}
            for appt in appointments:
                # Asegurarse de que start es un objeto datetime
                start_date = appt["start"] if isinstance(appt["start"], datetime) else datetime.now()
                date_str = start_date.strftime("%Y-%m-%d")
                
                if date_str not in date_groups:
                    date_groups[date_str] = {
                        "date": date_str,
                        "total_appointments": 0,
                        "insurance_payment_total": 0,
                        "direct_payment_total": 0
                    }
                
                date_groups[date_str]["total_appointments"] += 1
                
                # Determinar tipo de pago con manejo seguro
                payment_amount = 0
                payment_type = "direct"  # por defecto
                
                if "financial_info" in appt and appt["financial_info"]:
                    financial_info = appt["financial_info"]
                    if isinstance(financial_info, dict):
                        payment_method = financial_info.get("payment_method", "").lower()
                        payment_amount = financial_info.get("cost", 0)
                        
                        if "seguro" in payment_method or "insurance" in payment_method:
                            payment_type = "insurance"
                            date_groups[date_str]["insurance_payment_total"] += payment_amount
                            total_insurance += payment_amount
                        else:
                            date_groups[date_str]["direct_payment_total"] += payment_amount
                            total_direct += payment_amount
                
            # Convertir a lista ordenada por fecha
            report_data = sorted(date_groups.values(), key=lambda x: x["date"])
            
        else:  # individual
            for appt in appointments:
                # Asegurarse de que start es un objeto datetime
                start_date = appt["start"] if isinstance(appt["start"], datetime) else datetime.now()
                date_str = start_date.strftime("%Y-%m-%d")
                time_str = start_date.strftime("%H:%M")
                
                # Determinar tipo de pago con manejo seguro
                payment_amount = 0
                payment_type = "direct"  # por defecto
                
                if "financial_info" in appt and appt["financial_info"]:
                    financial_info = appt["financial_info"]
                    if isinstance(financial_info, dict):
                        payment_method = financial_info.get("payment_method", "").lower()
                        payment_amount = financial_info.get("cost", 0)
                        
                        if "seguro" in payment_method or "insurance" in payment_method:
                            payment_type = "insurance"
                            total_insurance += payment_amount
                        else:
                            total_direct += payment_amount
                
                report_data.append({
                    "date": date_str,
                    "time": time_str,
                    "patient": appt["patient_data"],
                    "payment_type": payment_type,
                    "amount": payment_amount
                })
        
        # Si no hay citas, devolver datos de ejemplo para pruebas
        if len(report_data) == 0:
            print("No se encontraron citas, devolviendo datos de ejemplo")
            if report_type == "grouped":
                report_data = [
                    {
                        "date": start_date_str,
                        "total_appointments": 0,
                        "insurance_payment_total": 0,
                        "direct_payment_total": 0
                    }
                ]
            else:
                report_data = []
        
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