from django.http import JsonResponse, HttpResponse
from bson import ObjectId
from datetime import datetime
from .config import (
    medical_records_collection,
    medical_procedures_collection,
    medical_comments_collection,
    medical_attachments_collection,
    users_collection,
    get_db
)
from django.views.decorators.csrf import csrf_exempt
import json
from .convert_objectid import convert_objectid
import traceback
import os

@csrf_exempt
def create_medical_record(request):
    """
    Crea o actualiza un registro médico para un paciente
    
    Espera un JSON con:
    {
        "patient_id": "id_del_paciente",
        "personal_info": {
            "full_name": "Nombre Completo",
            "birth_date": "YYYY-MM-DD",
            "identification": "Número de identificación",
            "insurance_number": "Número de seguro",
            "address": "Dirección",
            "contact_info": "Información de contacto"
        },
        "medical_background": {
            "allergies": ["alergia1", "alergia2"],
            "chronic_diseases": ["enfermedad1", "enfermedad2"],
            "family_history": "Historia familiar",
            "blood_type": "Tipo de sangre"
        }
    }
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        data = json.loads(request.body)
        
        # Validar datos
        if not data or not data.get('patient_id'):
            return JsonResponse({'error': 'Se requiere ID de paciente'}, status=400)
        
        patient_id = data['patient_id']
        
        # Verificar si el paciente ya tiene un registro
        existing_record = db.medical_records.find_one({'patient_id': patient_id})
        
        # Preparar datos para inserción/actualización
        record_data = {
            'patient_id': patient_id,
            'updated_at': datetime.utcnow()
        }
        
        # Añadir información personal si se proporciona
        if 'personal_info' in data:
            record_data['personal_info'] = data['personal_info']
        
        # Añadir antecedentes médicos si se proporcionan
        if 'medical_background' in data:
            record_data['medical_background'] = data['medical_background']
        
        # Insertar nuevo registro o actualizar existente
        if existing_record:
            db.medical_records.update_one(
                {'patient_id': patient_id},
                {'$set': record_data}
            )
            message = 'Registro médico actualizado'
        else:
            # Para nuevos registros, añadimos created_at
            record_data['created_at'] = datetime.utcnow()
            db.medical_records.insert_one(record_data)
            message = 'Registro médico creado'
        
        return JsonResponse({'success': True, 'message': message})
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

@csrf_exempt
def add_medical_procedure(request):
    """
    Añade un procedimiento médico a un paciente
    
    Espera un JSON con:
    {
        "patient_id": "id_del_paciente",
        "type": "Tipo de procedimiento",
        "service_id": "id_del_servicio", 
        "diagnosis": "Diagnóstico",
        "observations": "Observaciones",
        "staff": {
            "doctor": {
                "id": "id_del_doctor",
                "name": "Nombre del doctor",
                "license": "Licencia",
                "specialty": "Especialidad"
            },
            "nurse": {
                "id": "id_de_enfermera",
                "name": "Nombre de enfermera"
            }
        },
        "financial_info": {
            "cost": 100.00,
            "payment_method": "Método de pago",
            "copay": 30,
            "total": 100,
            "insurance_details": {
                "company": "Compañía",
                "policy_number": "Número de póliza",
                "coverage": "Porcentaje de cobertura"
            }
        }
    }
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        data = json.loads(request.body)
        
        # Validar datos
        if not data or not data.get('patient_id'):
            return JsonResponse({'error': 'Se requiere ID de paciente'}, status=400)
        
        # Validar campos obligatorios
        required_fields = ['type', 'diagnosis', 'staff', 'service_id']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return JsonResponse({'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'}, status=400)
        
        # Verificar que el servicio existe
        service_id = data['service_id']
        service = db.services.find_one({'_id': ObjectId(service_id)})
        if not service:
            return JsonResponse({'error': 'Servicio no encontrado'}, status=404)
        
        # Preparar datos del procedimiento
        procedure_data = {
            'patient_id': data['patient_id'],
            'type': data['type'],
            'service_id': ObjectId(service_id),
            'diagnosis': data['diagnosis'],
            'observations': data.get('observations', ''),
            'staff': data['staff'],
            'date': datetime.utcnow(),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Añadir información financiera si está disponible
        if 'financial_info' in data:
            procedure_data['financial_info'] = data['financial_info']
        
        # Insertar el procedimiento
        result = db.medical_procedures.insert_one(procedure_data)
        procedure_id = result.inserted_id
        
        return JsonResponse({
            'success': True, 
            'message': 'Procedimiento médico registrado', 
            'procedure_id': str(procedure_id)
        })
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

@csrf_exempt
def add_comment(request):
    """
    Añade un comentario a un procedimiento médico
    
    Espera un JSON con:
    {
        "procedure_id": "id_del_procedimiento",
        "user_id": "id_del_usuario",
        "user_role": "rol_del_usuario",
        "content": "Contenido del comentario"
    }
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        data = json.loads(request.body)
        
        # Validar datos
        required_fields = ['procedure_id', 'user_id', 'user_role', 'content']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return JsonResponse({'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'}, status=400)
        
        # Verificar que el procedimiento existe
        procedure_id = data['procedure_id']
        procedure = db.medical_procedures.find_one({'_id': ObjectId(procedure_id)})
        if not procedure:
            return JsonResponse({'error': 'Procedimiento médico no encontrado'}, status=404)
        
        # Preparar datos del comentario
        comment_data = {
            'procedure_id': ObjectId(procedure_id),
            'user_id': data['user_id'],
            'user_role': data['user_role'],
            'content': data['content'],
            'created_at': datetime.utcnow()
        }
        
        # Insertar el comentario
        result = db.medical_comments.insert_one(comment_data)
        
        # Actualizar la fecha de actualización del procedimiento
        db.medical_procedures.update_one(
            {'_id': ObjectId(procedure_id)},
            {'$set': {'updated_at': datetime.utcnow()}}
        )
        
        return JsonResponse({
            'success': True, 
            'message': 'Comentario añadido',
            'comment_id': str(result.inserted_id)
        })
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

def get_patient_record(request, patient_id):
    """
    Obtiene el registro médico completo de un paciente, incluyendo procedimientos,
    comentarios y archivos adjuntos
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        
        # Obtener datos básicos del paciente
        record = db.medical_records.find_one({'patient_id': patient_id})
        if not record:
            return JsonResponse({'error': 'Registro médico no encontrado'}, status=404)
        
        # Convertir ObjectId a string para serialización JSON
        record['_id'] = str(record['_id'])
        
        # Obtener procedimientos del paciente
        procedures_cursor = db.medical_procedures.find({'patient_id': patient_id})
        procedures = list(procedures_cursor)
        
        # Procesar cada procedimiento para incluir comentarios y archivos adjuntos
        for proc in procedures:
            proc_id = proc['_id']
            proc['_id'] = str(proc_id)
            
            # Convertir service_id si existe
            if 'service_id' in proc:
                proc['service_id'] = str(proc['service_id'])
            
            # Convertir IDs en staff si existen
            if 'staff' in proc:
                if 'doctor' in proc['staff'] and 'id' in proc['staff']['doctor']:
                    proc['staff']['doctor']['id'] = str(proc['staff']['doctor']['id'])
                if 'nurse' in proc['staff'] and 'id' in proc['staff']['nurse']:
                    proc['staff']['nurse']['id'] = str(proc['staff']['nurse']['id'])
            
            # Obtener comentarios del procedimiento
            comments_cursor = db.medical_comments.find({'procedure_id': proc_id})
            proc['comments'] = list(comments_cursor)
            for comment in proc['comments']:
                comment['_id'] = str(comment['_id'])
                comment['procedure_id'] = str(comment['procedure_id'])
                if 'user_id' in comment:
                    comment['user_id'] = str(comment['user_id'])
            
            # Obtener archivos adjuntos del procedimiento
            attachments_cursor = db.medical_attachments.find({'procedure_id': proc_id})
            proc['attachments'] = list(attachments_cursor)
            for attachment in proc['attachments']:
                attachment['_id'] = str(attachment['_id'])
                attachment['procedure_id'] = str(attachment['procedure_id'])
                if 'user_id' in attachment:
                    attachment['user_id'] = str(attachment['user_id'])
        
        # Añadir procedimientos al registro
        record['procedures'] = procedures
        
        return JsonResponse({'success': True, 'record': record}, safe=False)
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

@csrf_exempt
def upload_attachment(request):
    """
    Sube un archivo adjunto a un procedimiento médico
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        
        # Validar que se proporcionó un archivo
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No se proporcionó archivo'}, status=400)
        
        file = request.FILES['file']
        if file.name == '':
            return JsonResponse({'error': 'Nombre de archivo vacío'}, status=400)
        
        # Validar procedimiento_id y user_id
        procedure_id = request.POST.get('procedure_id')
        user_id = request.POST.get('user_id')
        
        if not procedure_id or not user_id:
            return JsonResponse({'error': 'Se requiere procedure_id y user_id'}, status=400)
        
        # Verificar que el procedimiento existe
        procedure = db.medical_procedures.find_one({'_id': ObjectId(procedure_id)})
        if not procedure:
            return JsonResponse({'error': 'Procedimiento médico no encontrado'}, status=404)
        
        # Obtener detalles del paciente para crear la ruta del archivo
        patient_id = procedure['patient_id']
        
        # Crear directorio para almacenar archivos si no existe
        uploads_dir = os.path.join('uploads', 'medical', patient_id, procedure_id)
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Guardar el archivo
        file_path = os.path.join(uploads_dir, file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # URL relativa del archivo
        file_url = f'/uploads/medical/{patient_id}/{procedure_id}/{file.name}'
        
        # Registrar el archivo en la base de datos
        attachment_data = {
            'procedure_id': ObjectId(procedure_id),
            'user_id': user_id,
            'file_name': file.name,
            'file_url': file_url,
            'file_type': file.content_type,
            'file_size': os.path.getsize(file_path),
            'description': request.POST.get('description', ''),
            'created_at': datetime.utcnow()
        }
        
        result = db.medical_attachments.insert_one(attachment_data)
        
        # Actualizar la fecha de actualización del procedimiento
        db.medical_procedures.update_one(
            {'_id': ObjectId(procedure_id)},
            {'$set': {'updated_at': datetime.utcnow()}}
        )
        
        return JsonResponse({
            'success': True, 
            'message': 'Archivo adjunto subido',
            'attachment_id': str(result.inserted_id),
            'file_url': file_url
        })
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

def get_attachment(request, attachment_id):
    """
    Devuelve un archivo adjunto específico
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        
        # Buscar el adjunto en la base de datos
        attachment = db.medical_attachments.find_one({'_id': ObjectId(attachment_id)})
        if not attachment:
            return JsonResponse({'error': 'Archivo adjunto no encontrado'}, status=404)
        
        # Obtener la ruta del archivo
        file_path = '.' + attachment['file_url']
        
        # Verificar si el archivo existe
        if not os.path.exists(file_path):
            return JsonResponse({'error': 'Archivo no encontrado en el servidor'}, status=404)
        
        # Devolver el archivo
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=attachment['file_type'])
            response['Content-Disposition'] = f'attachment; filename="{attachment["file_name"]}"'
            return response
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)

def get_doctor_patients(request, doctor_id):
    """
    Obtiene los pacientes que tienen registros médicos con procedimientos donde el doctor está asignado.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        db = get_db()
        
        # Verificar que el doctor existe
        doctor = db.users.find_one({"_id": ObjectId(doctor_id)})
        if not doctor:
            return JsonResponse({"error": "Doctor no encontrado"}, status=404)
        
        # Buscar procedimientos donde el doctor está asignado
        doctor_procedures = list(db.medical_procedures.find(
            {"staff.doctor.id": str(doctor_id)},
            {"patient_id": 1}
        ))
        
        # Extraer IDs de pacientes únicos
        patient_ids = set()
        for proc in doctor_procedures:
            if proc.get("patient_id"):
                patient_ids.add(proc["patient_id"])
        
        # Buscar información de los pacientes
        patients = []
        for patient_id in patient_ids:
            # Si el ID es un ObjectId, convertirlo a string para la búsqueda
            if isinstance(patient_id, ObjectId):
                patient_id_str = str(patient_id)
            else:
                patient_id_str = patient_id
                
            try:
                # Buscar el paciente en la colección de usuarios
                patient = db.users.find_one({"_id": ObjectId(patient_id_str)})
                
                if patient and patient.get("rol", "").lower() in ("patient", "paciente"):
                    # Convertir ObjectId a string para serialización JSON
                    patient["_id"] = str(patient["_id"])
                    patients.append(patient)
            except Exception as e:
                print(f"Error al buscar paciente {patient_id}: {str(e)}")
                continue
        
        # Si no se encontraron pacientes, intentar buscar pacientes con registros médicos
        if not patients:
            print("No se encontraron procedimientos para el doctor. Buscando pacientes con registros médicos.")
            
            # Obtener todos los pacientes con registros médicos
            records = list(db.medical_records.find({}, {"patient_id": 1}))
            record_patient_ids = [record["patient_id"] for record in records if "patient_id" in record]
            
            for patient_id in record_patient_ids:
                if isinstance(patient_id, ObjectId):
                    patient_id_str = str(patient_id)
                else:
                    patient_id_str = patient_id
                
                try:
                    patient = db.users.find_one({"_id": ObjectId(patient_id_str)})
                    if patient and patient.get("rol", "").lower() in ("patient", "paciente"):
                        patient["_id"] = str(patient["_id"])
                        patients.append(patient)
                except Exception as e:
                    print(f"Error al buscar paciente con registro {patient_id}: {str(e)}")
                    continue
        
        # Construir respuesta
        response = {
            "doctor_id": doctor_id,
            "doctor_name": doctor.get("name", doctor.get("username", "")),
            "patients_count": len(patients),
            "patients": patients
        }
        
        return JsonResponse(response)
    
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": f"Error inesperado: {str(e)}"}, status=500) 