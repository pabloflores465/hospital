from django.http import JsonResponse
from bson import ObjectId
from .config import users_collection


def get_users(request):
    if request.method == "GET":
        try:
            users = list(users_collection.find({}))
            if users.get("profile"):
                users.pop("profile", None)
            return JsonResponse({"appointments": users}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)
