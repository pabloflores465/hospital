from django.http import JsonResponse
from .config import contact_collection, moderation_collection, audit_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
import json


def get_contact(request):
    if request.method == "GET":
        try:
            contact = contact_collection.find_one({})
            contact["_id"] = str(contact["_id"])
            return JsonResponse({"history": contact}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_moderation_contact(request):
    if request.method == "PUT":
        try:
            new_contact = json.loads(request.body)
            id = ObjectId(new_contact["_id"])
            moderation_contact = moderation_collection.find_one({"page_id": id})
            new_contact.pop("_id", None)
            moderation_contact["old_val"] = moderation_contact["new_val"]
            moderation_contact["new_val"] = new_contact
            moderation_collection.replace_one({"page_id": id}, moderation_contact)
            return JsonResponse({"message": "contact passed to moderation"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def put_audit_contact(request):
    if request.method == "PUT":
        try:
            new_contact = json.loads(request.body)
            id = ObjectId(new_contact["_id"])
            new_contact.pop("_id", None)
            audit_collection.update_one(
                {"page_id": id}, {"$push": {"values": new_contact}}
            )
            return JsonResponse({"message": "contact passed to audit"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def post_contact(request):
    if request.method == "POST":
        try:
            updated_contact = json.loads(request.body)
            updated_contact["_id"] = ObjectId(updated_contact["_id"])
            contact_collection.replace_one(
                {"_id": updated_contact["_id"]}, updated_contact
            )
            return JsonResponse({"message": "contact updated successfully"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
