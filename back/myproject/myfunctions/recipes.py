from django.http import JsonResponse
from .config import recipes_collection, medicines_collection, users_collection
from .get_list import get_list
from copy import deepcopy


def get_recipes(request):
    if request.method == "GET":
        try:
            medicines = []
            recipes = []
            users = []
            if not medicines:
                get_list(medicines, medicines_collection)
            if not recipes:
                get_list(recipes, recipes_collection)
            if not users:
                get_list(users, users_collection)

            doctors = []
            for user in users:
                if user["rol"] == "doctor":
                    doctors.append(user)

            patients = []
            for user in users:
                if user["rol"] == "paciente":
                    patients.append(user)

            recipes_medicines = deepcopy(recipes)
            for recipe in recipes_medicines:
                if "medicines" in recipe:
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine_object = medicine_id
                        for medicine in medicines:
                            if "_id" in medicine and medicine_id == medicine.get("_id"):
                                medicine_object = medicine
                                recipe["medicines"][index] = medicine_object

            for recipe in recipes_medicines:
                code_string = ""
                for code in recipe["code"]:
                    code_string = f"{code_string}-{code}"
                recipe["code"] = code_string[1:]

            for recipe in recipes_medicines:
                for doctor in doctors:
                    if doctor["_id"] == recipe["doctor"]:
                        recipe["doctor"] = doctor["username"]

            for recipe in recipes_medicines:
                for patient in patients:
                    if patient["_id"] == recipe["patient"]:
                        recipe["patient"] = patient["username"]

            return JsonResponse({"categories": recipes_medicines}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
