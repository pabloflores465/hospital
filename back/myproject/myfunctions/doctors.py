from django.http import JsonResponse
from .config import users_collection, profiles_collection, appointments_collection


def get_doctors(request, doctor_id=None):
    if request.method == "GET":
        try:
            doctors = []
            if doctor_id:
                cursor = users_collection.find_one({"_id": doctor_id, "rol": "doctor"})
            else:
                cursor = users_collection.find({"rol": "doctor"})
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if doc.get("profile"):
                    doc["profile"] = profiles_collection.find_one(
                        {"_id": doc["profile"]}
                    )
                    doc["profile"]["_id"] = str(doc["profile"]["_id"])
                    appointments = []
                    for appointment_id in doc.get("appointments", []):
                        appointment = appointments_collection.find_one(
                            {"_id": appointment_id}
                        )
                        if appointment:
                            appointment["_id"] = str(appointment["_id"])
                            appointments.append(appointment)
                        else:
                            appointments.append("")
                    doc["appointments"] = appointments
                    doc["profile"].pop("services", None)
                    patients_list = []
                    for patient_entry in doc["profile"].get("patients", []):
                        patient_doc = users_collection.find_one(
                            {"_id": patient_entry, "rol": "paciente"}
                        )
                        if patient_doc:
                            patient_doc["_id"] = str(patient_doc["_id"])
                            if patient_doc.get("profile"):
                                patient_doc.pop("profile", None)
                            patients_list.append(patient_doc)
                    doc["profile"]["patients"] = patients_list
                else:
                    doc["profile"] = ""
                doctors.append(doc)
            return JsonResponse({"doctors": doctors}, status=200)
        except Exception as e:
            import traceback

            return JsonResponse(
                {"error": str(e), "traceback": traceback.format_exc()}, status=500
            )
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


def post_doctor(request):
    if request.method == "POST":
        try:
            data = request.POST
            doctor = {
                "name": data.get("name"),
                "lastname": data.get("lastname"),
                "email": data.get("email"),
                "password": data.get("password"),
                "rol": "doctor",
            }
            doctor_id = users_collection.insert_one(doctor).inserted_id
            return JsonResponse({"doctor_id": str(doctor_id)}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


def get_doctor_count(request):
    if request.method == "GET":
        try:
            doctor_count = users_collection.count_documents({"rol": "doctor"})
            return JsonResponse({"doctor_count": doctor_count}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)
