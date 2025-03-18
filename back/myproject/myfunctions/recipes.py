from django.http import JsonResponse
from bson import ObjectId
from .config import recipes_collection, medicines_collection, users_collection
from .get_list import get_list
from copy import deepcopy
from .convert_objectid import convert_objectid
import traceback

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

            for recipe in recipes_medicines:
                patient = users_collection.find_one({"_id": recipe["patient"]})
                if patient:
                    patient["_id"] = str(patient["_id"])
                    patient.pop("profile", None)
                else:
                    recipe["patient"] = ""
                recipe["patient"] = patient


            return JsonResponse({"recipes": recipes_medicines}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def get_recipes_by_patient_id(request, user_id):
    if request.method == "GET":
        try:
            recipes = []

            if not recipes:
                cursor = recipes_collection.find({"patient": ObjectId(user_id)})
                for doc in cursor:
                    doc = convert_objectid(doc)
                    recipes.append(doc)

            for recipe in recipes:

                if recipe.get("medicines"):
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine = medicines_collection.find_one(
                            {"_id": ObjectId(medicine_id)}
                        )
                        medicine = convert_objectid(medicine)
                        if medicine:
                            recipe["medicines"][index] = medicine

                if recipe.get("patient"):
                    patient = users_collection.find_one(
                        {"_id": ObjectId(recipe["patient"])}
                    )
                    if patient:
                        recipe["patient"] = patient["username"]

                if recipe.get("doctor"):
                    doctor = users_collection.find_one(
                        {"_id": ObjectId(recipe["doctor"])}
                    )
                    if doctor:
                        recipe["doctor"] = doctor["username"]

                code_string = ""
                for code in recipe["code"]:
                    code_string = f"{code_string}-{code}"
                recipe["code"] = code_string[1:]

            return JsonResponse({"recipes": recipes}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


def get_recipes_by_doctor_id(request, user_id):
    if request.method == "GET":
        try:
            recipes = []

            if not recipes:
                cursor = recipes_collection.find({"doctor": ObjectId(user_id)})
                for doc in cursor:
                    doc = convert_objectid(doc)
                    recipes.append(doc)

            for recipe in recipes:

                if recipe.get("medicines"):
                    for index, medicine_id in enumerate(recipe["medicines"]):
                        medicine = medicines_collection.find_one(
                            {"_id": ObjectId(medicine_id)}
                        )
                        medicine = convert_objectid(medicine)
                        if medicine:
                            recipe["medicines"][index] = medicine

                if recipe.get("doctor"):
                    doctor = users_collection.find_one(
                        {"_id": ObjectId(recipe["doctor"])}
                    )
                    if doctor:
                        recipe["doctor"] = doctor["username"]

                code_string = ""
                for code in recipe["code"]:
                    code_string = f"{code_string}-{code}"
                recipe["code"] = code_string[1:]

                patient = users_collection.find_one({"_id": ObjectId(recipe["patient"])})
                if patient:
                    patient["_id"] = str(patient["_id"])
                    if patient.get("profile"):
                        patient.pop("profile", None)
                else:
                    recipe["patient"] = {}
                recipe["patient"] = patient

            return JsonResponse({"recipes": recipes}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
