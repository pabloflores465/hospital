from django.http import JsonResponse
from .config import footer_collection
from bson import ObjectId


def get_footer(request):
    if request.method == "GET":
        try:
            footer = footer_collection.find_one({})
            footer["_id"] = str(footer["_id"])
            return JsonResponse({"footer": footer}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
