from django.http import JsonResponse
from .config import faq_collection, moderation_collection, audit_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import json


def get_faq(request):
    if request.method == "GET":
        try:
            faq = faq_collection.find_one({})
            faq["_id"] = str(faq["_id"])
            return JsonResponse({"history": faq}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_moderation_faq(request):
    if request.method == "PUT":
        try:
            new_faq = json.loads(request.body)
            id = ObjectId(new_faq["_id"])
            moderation_faq = moderation_collection.find_one({"page_id": id})
            new_faq.pop("_id", None)
            moderation_faq["old_val"] = moderation_faq["new_val"]
            moderation_faq["new_val"] = new_faq
            moderation_collection.replace_one({"page_id": id}, moderation_faq)
            return JsonResponse({"message": "faq passed to moderation"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_audit_faq(request):
    if request.method == "PUT":
        try:
            new_faq = json.loads(request.body)
            id = ObjectId(new_faq["_id"])
            new_faq.pop("_id", None)
            audit_collection.update_one({"page_id": id}, {"$push": {"values": new_faq}})
            return JsonResponse({"message": "faq passed to audit"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def post_faq(request):
    if request.method == "POST":
        try:
            updated_faq = json.loads(request.body)
            updated_faq["_id"] = ObjectId(updated_faq["_id"])
            faq_collection.replace_one({"_id": updated_faq["_id"]}, updated_faq)
            return JsonResponse({"message": "faq updated successfully"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
