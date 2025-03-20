from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .config import comments_collection, users_collection
import json


def get_next_comment(comment):
    if "_id" in comment:
        comment["_id"] = str(comment["_id"])
    if "parent" in comment:
        comment["parent"] = str(comment["parent"])
    comment["author_id"] = str(comment["author"])
    author = users_collection.find_one({"_id": comment["author"]})
    comment["author"] = author["username"] if author else "Autor desconocido"
    if "previous_comment" in comment:
        comment["previous_comment"] = str(comment["previous_comment"])
    if not "next_comment" in comment:
        return
    else:
        for current_comment in comment["next_comment"]:
            get_next_comment(current_comment)


def get_comments(request, parent_id):
    if request.method == "GET":
        try:
            comments = list(comments_collection.find({"parent": ObjectId(parent_id)}))
            # print(comments)
            for comment in comments:
                get_next_comment(comment)
            return JsonResponse({"comments": comments}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


def convert_ids(comment):
    if "parent" in comment:
        comment["parent"] = ObjectId(comment["parent"])

    if "author" in comment:
        comment["author"] = ObjectId(comment["author_id"])
        print(comment["author"])
        comment["author"] = ObjectId(comment["author"])

    if "next_comment" in comment:
        for current_comment in comment["next_comment"]:
            convert_ids(current_comment)


@csrf_exempt
def post_comment(request, parent_id=None):
    if request.method == "POST":
        try:
            if parent_id:
                parent_id = ObjectId(parent_id)
            data = json.loads(request.body)
            pretty_json = json.dumps(data, indent=4, ensure_ascii=False)
            print("Datos recibidos:", pretty_json)
            if "_id" in data:
                del data["_id"]
            if not "parent" in data:
                return JsonResponse({"error": "Missing parent id"}, status=400)

            comment = comments_collection.find_one({"_id": parent_id})
            if not parent_id:
                convert_ids(data)
                comments_collection.insert_one(data)
            elif not comment:
                convert_ids(data)
                comments_collection.insert_one(data)
            else:
                convert_ids(data)
                # print(data)
                comments_collection.replace_one({"_id": parent_id}, data)
            return JsonResponse(
                {"mensaje": "Comentario agregado con éxito"}, status=200
            )
        except Exception as e:
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)
