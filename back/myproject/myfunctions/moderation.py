from django.http import JsonResponse
from .config import moderation_collection
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId


@csrf_exempt
def clear_history(request, page_id):
    if request.method == "PUT":
        try:
            moderation_collection.update_one(
                {"page_id": ObjectId(page_id)}, {"$set": {"old_val": {}, "new_val": {}}}
            )
            return JsonResponse({"message": "values cleared correctly"}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def get_changes(request):
    if request.method == "GET":
        try:
            changes = list(moderation_collection.find({}))
            for change in changes:
                change["_id"] = str(change["_id"])
                if "67dcdf04a2c5bc1c837569f7" == str(change["page_id"]):
                    change["page_id"] = {
                        "page_id": str(change["page_id"]),
                        "page_name": "history",
                    }
                elif "67dcdcb6a2c5bc1c837569f3" == str(change["page_id"]):
                    change["page_id"] = {
                        "page_id": str(change["page_id"]),
                        "page_name": "mission",
                    }
                elif "67dcddf0a2c5bc1c837569f5" == str(change["page_id"]):
                    change["page_id"] = {
                        "page_id": str(change["page_id"]),
                        "page_name": "vision",
                    }
                elif "67dcf9e1a2c5bc1c837569f9" == str(change["page_id"]):
                    change["page_id"] = {
                        "page_id": str(change["page_id"]),
                        "page_name": "contact",
                    }
                elif "67dcfae9a2c5bc1c837569fb" == str(change["page_id"]):
                    change["page_id"] = {
                        "page_id": str(change["page_id"]),
                        "page_name": "faq",
                    }
            return JsonResponse({"message": changes}, status=200)

        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
