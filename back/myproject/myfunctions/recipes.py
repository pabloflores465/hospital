from django.http import JsonResponse
import json
from bson import ObjectId
from .config import recipes_collection, medicines_collection, users_collection
from .get_list import get_list
from copy import deepcopy
from .convert_objectid import convert_objectid
from datetime import datetime
from .db import get_db


def get_recipes(request):
    if request.method == 'GET':
        try:
            db = get_db()
            recipes = list(db.recipes.find())
            for recipe in recipes:
                recipe['_id'] = str(recipe['_id'])
                recipe['date'] = recipe['date'].isoformat() if isinstance(recipe['date'], datetime) else recipe['date']
            return JsonResponse({'recipes': recipes})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            db = get_db()
            data['date'] = datetime.now()
            result = db.recipes.insert_one(data)
            data['_id'] = str(result.inserted_id)
            data['date'] = data['date'].isoformat()
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


def get_recipes_by_patient_id(request, patient_id):
    if request.method == 'GET':
        try:
            db = get_db()
            recipes = list(db.recipes.find({'patient': patient_id}))
            for recipe in recipes:
                recipe['_id'] = str(recipe['_id'])
                recipe['date'] = recipe['date'].isoformat() if isinstance(recipe['date'], datetime) else recipe['date']
            return JsonResponse({'recipes': recipes})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


def get_recipes_by_doctor_id(request, doctor_id):
    if request.method == 'GET':
        try:
            db = get_db()
            recipes = list(db.recipes.find({'doctor': doctor_id}))
            for recipe in recipes:
                recipe['_id'] = str(recipe['_id'])
                recipe['date'] = recipe['date'].isoformat() if isinstance(recipe['date'], datetime) else recipe['date']
            return JsonResponse({'recipes': recipes})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
