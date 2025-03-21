from django.http import JsonResponse
from .config import audit_collection
from bson import ObjectId


def get_all_changes(request):
    if request.method == "GET":
        try:
            changes = list(audit_collection.find({}))
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
                        "page_name": "content",
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
