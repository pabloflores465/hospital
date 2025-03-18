from .convert_objectid import convert_objectid


def get_list(list, collection):
    cursor = collection.find()
    for doc in cursor:
        doc = convert_objectid(doc)
        list.append(doc)
