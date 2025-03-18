import requests
from django.conf import settings

def enviar_correo_mailgun(to_email, subject, text):
    return requests.post(
        f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
        auth=("api", settings.MAILGUN_API_KEY),
        data={
            "from": f"Tu Nombre <mailgun@{settings.MAILGUN_DOMAIN}>",
            "to": [to_email],
            "subject": subject,
            "text": text,
        }
    )
