from bson.objectid import ObjectId

def convert_objectid(value):
    """
    Convierte los ObjectId a string para que sean serializables a JSON
    Puede manejar valores individuales, listas, diccionarios y estructuras anidadas
    """
    if isinstance(value, ObjectId):
        return str(value)
    elif isinstance(value, list):
        return [convert_objectid(item) for item in value]
    elif isinstance(value, dict):
        return {key: convert_objectid(val) for key, val in value.items()}
    return value

def ensure_serializable(data):
    """
    Garantiza que todos los datos sean serializables a JSON, convirtiendo ObjectId y otros tipos
    no serializables a formatos adecuados.
    """
    if isinstance(data, dict):
        return {k: ensure_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [ensure_serializable(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    # Si es otro tipo no serializable, puedes agregar conversiones adicionales aquí
    return data
