from django.http import JsonResponse
from .config import vision_collection, moderation_collection, audit_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import json


def get_vision(request):
    if request.method == "GET":
        try:
            vision = vision_collection.find_one({})
            vision["_id"] = str(vision["_id"])
            return JsonResponse({"history": vision}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_moderation_vision(request):
    if request.method == "PUT":
        try:
            new_vision = json.loads(request.body)
            id = ObjectId(new_vision["_id"])
            moderation_vision = moderation_collection.find_one({"page_id": id})
            new_vision.pop("_id", None)
            moderation_vision["old_val"] = moderation_vision["new_val"]
            moderation_vision["new_val"] = new_vision
            moderation_collection.replace_one({"page_id": id}, moderation_vision)
            return JsonResponse({"message": "vision passed to moderation"}, status=200)
        except Exception as e:
            import trvision

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_audit_vision(request):
    if request.method == "PUT":
        try:
            new_vision = json.loads(request.body)
            id = ObjectId(new_vision["_id"])
            new_vision.pop("_id", None)
            audit_collection.update_one(
                {"page_id": id}, {"$push": {"values": new_vision}}
            )
            return JsonResponse({"message": "vision passed to audit"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def post_vision(request):
    if request.method == "POST":
        try:
            updated_vision = json.loads(request.body)
            updated_vision["_id"] = ObjectId(updated_vision["_id"])
            vision_collection.replace_one(
                {"_id": updated_vision["_id"]}, updated_vision
            )
            return JsonResponse({"message": "vision updated successfully"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
