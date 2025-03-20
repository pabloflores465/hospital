import json
import traceback
from django.http import JsonResponse
from bson import ObjectId
from django.views.decorators.csrf import csrf_exempt
from .config import categories_collection  # Asegúrate de definir esta colección en config.py
from .get_list import get_list

@csrf_exempt
def create_category(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        doc = {
            "name": data["name"],
            # Opcional: lista de subcategorías como ObjectId si se envía
            "subcategories": [ObjectId(sc) for sc in data.get("subcategories", [])]
        }
        result = categories_collection.insert_one(doc)
        return JsonResponse({"_id": str(result.inserted_id)}, status=201)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

def get_categories(request):
    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        categories = []
        get_list(categories, categories_collection)
        for cat in categories:
            cat["_id"] = str(cat["_id"])
            # Convertir los ObjectId de subcategorías a string, si existen
            if "subcategories" in cat:
                cat["subcategories"] = [str(sc) for sc in cat["subcategories"]]
        return JsonResponse({"categories": categories}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_category(request, category_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        update_fields = {}
        if "name" in data:
            update_fields["name"] = data["name"]
        if "subcategories" in data:
            update_fields["subcategories"] = [ObjectId(sc) for sc in data["subcategories"]]
        result = categories_collection.update_one({"_id": ObjectId(category_id)}, {"$set": update_fields})
        if result.matched_count == 0:
            return JsonResponse({"error": "Categoría no encontrada"}, status=404)
        return JsonResponse({"updated": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_category(request, category_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        # Aquí se realiza eliminación física; para soft delete se podría actualizar un campo "deleted"
        result = categories_collection.delete_one({"_id": ObjectId(category_id)})
        if result.deleted_count == 0:
            return JsonResponse({"error": "Categoría no encontrada"}, status=404)
        return JsonResponse({"deleted": True}, status=200)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=400)
