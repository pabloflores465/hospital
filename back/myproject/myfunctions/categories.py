from django.http import JsonResponse
from .config import categories_collection, subcategories_collection
from .convert_objectid import convert_objectid
from copy import deepcopy

categories = []
subcategories = []


def get_categories():
    categories_cursor = categories_collection.find()
    for doc in categories_cursor:
        doc = convert_objectid(doc)
        categories.append(doc)


def get_subcategories():
    subcategories_cursor = subcategories_collection.find()
    for doc in subcategories_cursor:
        doc = convert_objectid(doc)
        subcategories.append(doc)


def get_cat_sub(request):
    if request.method == "GET":
        try:
            if not categories:
                get_categories()
            if not subcategories:
                get_subcategories()
            categories_subcategories = deepcopy(categories)
            for cat in categories_subcategories:
                if "subcategories" in cat:
                    for idx, sub_id in enumerate(cat["subcategories"]):
                        sub_name = sub_id
                        for sub in subcategories:
                            if "_id" in sub and sub_id == sub.get("_id"):
                                sub_name = sub.get("name")
                                cat["subcategories"][idx] = sub_name
            return JsonResponse({"categories": categories_subcategories}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
