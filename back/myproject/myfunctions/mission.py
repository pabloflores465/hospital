from django.http import JsonResponse
from .config import mission_collection, moderation_collection, audit_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import json


def get_mission(request):
    if request.method == "GET":
        try:
            mission = mission_collection.find_one({})
            mission["_id"] = str(mission["_id"])
            return JsonResponse({"history": mission}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_moderation_mission(request):
    if request.method == "PUT":
        try:
            new_mission = json.loads(request.body)
            id = ObjectId(new_mission["_id"])
            moderation_mission = moderation_collection.find_one({"page_id": id})
            new_mission.pop("_id", None)
            moderation_mission["old_val"] = moderation_mission["new_val"]
            moderation_mission["new_val"] = new_mission
            moderation_collection.replace_one({"page_id": id}, moderation_mission)
            return JsonResponse({"message": "mission passed to moderation"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_audit_mission(request):
    if request.method == "PUT":
        try:
            new_mission = json.loads(request.body)
            id = ObjectId(new_mission["_id"])
            new_mission.pop("_id", None)
            audit_collection.update_one(
                {"page_id": id}, {"$push": {"values": new_mission}}
            )
            return JsonResponse({"message": "mission passed to audit"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def post_mission(request):
    if request.method == "POST":
        try:
            updated_mission = json.loads(request.body)
            updated_mission["_id"] = ObjectId(updated_mission["_id"])
            mission_collection.replace_one(
                {"_id": updated_mission["_id"]}, updated_mission
            )
            return JsonResponse({"message": "mission updated successfully"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
