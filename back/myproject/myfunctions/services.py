from django.http import JsonResponse
from .config import services_collection, results_collection, users_collection, categories_collection, subcategories_collection, ensurances_collection

def get_all_services(request):
    if request.method == "GET":
        try:
            services = []
            if not services:
                cursor = services_collection.find()
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    doc["results"] = results_collection.find_one({"_id": doc["results"]})
                    if doc.get("results"):
                        doc["results"]["_id"] = str(doc["results"]["_id"])
                    else:
                        doc["results"] = ""
                    doc["patient"] = users_collection.find_one({"_id": doc["patient"]})
                    if doc.get("patient") == None:
                        doc["patient"] = ""
                    else:
                        doc["patient"]["_id"] = str(doc["patient"]["_id"])
                        doc["patient"]["profile"] = str(doc["patient"]["profile"])

                    category_ids = doc.get("categories", [])
                    expanded_categories = []
                    for cat_id in category_ids:
                        category_doc = categories_collection.find_one({"_id": cat_id})
                        if category_doc:
                            category_doc["_id"] = str(category_doc["_id"])
                            expanded_categories.append(category_doc)
                            category_doc.pop("subcategories", None)
                        else:
                            expanded_categories.append("")
                    doc["categories"] = expanded_categories

                    subcategory_ids = doc.get("subcategories", [])
                    expanded_subcategories = []
                    for subcat_id in subcategory_ids:
                        subcategory_doc = subcategories_collection.find_one({"_id": subcat_id})
                        if subcategory_doc:
                            subcategory_doc["_id"] = str(subcategory_doc["_id"])
                            expanded_subcategories.append(subcategory_doc)
                        else:
                            expanded_subcategories.append("")
                    doc["subcategories"] = expanded_subcategories

                    custodian_ids = doc.get("custodians", [])
                    expanded_custodians = []
                    for custodian_id in custodian_ids:
                        custodian_doc = users_collection.find_one({"_id": custodian_id})
                        if custodian_doc:
                            custodian_doc["_id"] = str(custodian_doc["_id"])
                            if custodian_doc.get("profile") == None:
                                custodian_doc["profile"] = ""
                            else:
                                custodian_doc["profile"] = str(custodian_doc["profile"])
                            expanded_custodians.append(custodian_doc)
                        else:
                            expanded_custodians.append("")
                    doc["custodians"] = expanded_custodians
                    
                    expanded_ensurances = []
                    for ensurance_id in doc.get("ensurances", []):
                        ensurance_doc = ensurances_collection.find_one({"_id": ensurance_id})
                        if ensurance_doc:
                            ensurance_doc["_id"] = str(ensurance_doc["_id"])
                            expanded_ensurances.append(ensurance_doc)
                        else:
                            expanded_ensurances.append("")
                    doc["ensurances"] = expanded_ensurances

                    services.append(doc)
            return JsonResponse({"services": services}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
