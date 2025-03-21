from django.http import JsonResponse
from .config import history_collection, moderation_collection, audit_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import json


def get_history(request):
    if request.method == "GET":
        try:
            history = history_collection.find_one({})
            history["_id"] = str(history["_id"])
            return JsonResponse({"history": history}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_moderation_history(request):
    if request.method == "PUT":
        try:
            new_history = json.loads(request.body)
            id = ObjectId(new_history["_id"])
            moderation_history = moderation_collection.find_one({"page_id": id})
            new_history.pop("_id", None)
            moderation_history["old_val"] = moderation_history["new_val"]
            moderation_history["new_val"] = new_history
            moderation_collection.replace_one({"page_id": id}, moderation_history)
            return JsonResponse({"message": "History passed to moderation"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_audit_history(request):
    if request.method == "PUT":
        try:
            new_history = json.loads(request.body)
            id = ObjectId(new_history["_id"])
            new_history.pop("_id", None)
            audit_collection.update_one(
                {"page_id": id}, {"$push": {"values": new_history}}
            )
            return JsonResponse({"message": "History passed to audit"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def post_history(request):
    if request.method == "POST":
        try:
            updated_history = json.loads(request.body)
            updated_history["_id"] = ObjectId(updated_history["_id"])
            history_collection.replace_one(
                {"_id": updated_history["_id"]}, updated_history
            )
            return JsonResponse({"message": "History updated successfully"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
