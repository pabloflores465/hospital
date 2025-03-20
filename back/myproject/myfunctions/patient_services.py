from django.http import JsonResponse
from .config import (
    users_collection,
    profiles_collection,
    ensurances_collection,
    services_collection,
)
from bson import ObjectId


def get_patient_services(request):
    if request.method == "GET":
        try:
            users = list(
                users_collection.find(
                    {"rol": "paciente"},
                    {"_id": 1, "username": 1, "email": 1, "profile": 1},
                )
            )

            for user in users:
                user["_id"] = str(user["_id"])
                if "profile" in user:
                    profile = profiles_collection.find_one(
                        {"_id": ObjectId(user["profile"])},
                        {
                            "_id": 1,
                            "services": 1,
                            "dpi": 1,
                            "affiliation_no": 1,
                            "license_no": 1,
                            "phone": 1,
                            "birth_date": 1,
                            "photo": 1,
                            "ensurance_company": 1,
                        },
                    )
                    profile["_id"] = str(profile["_id"])
                    profile["ensurance_company"] = ensurances_collection.find_one(
                        {"_id": ObjectId(profile["ensurance_company"])},
                        {"_id": 1, "name": 1},
                    )
                    profile["ensurance_company"]["_id"] = str(
                        profile["ensurance_company"]["_id"]
                    )
                    for index, service in enumerate(profile.get("services", [])):
                        service = services_collection.find_one(
                            {"_id": ObjectId(service)}, {"_id": 1, "name": 1}
                        )
                        service["_id"] = str(service["_id"])
                        profile["services"][index] = service
                    user["profile"] = profile
                else:
                    user["profile"] = {}
            return JsonResponse({"patients": users}, status=200)

        except Exception as e:
            import traceback

            tb = traceback.format_exc()
            return JsonResponse({"error": str(e), "traceback": tb}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
