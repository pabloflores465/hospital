"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path

# from myproject.views import obtener_Hospital  # Importar las vistas
# from myproject.views import register
# from myproject.views import obtener_csrf
from .views import (
    actualizar_paciente,
    borrar_paciente,
    insertar_paciente,
    login_paciente,
    lista_pacientes,
    obtener_paciente,
    registrar_paciente,
    validar_paciente,
)

from .myfunctions.categories import get_cat_sub
from .myfunctions.recipes import (
    get_recipes,
    get_recipes_by_patient_id,
    get_recipes_by_doctor_id,
)

# from myproject.views import SendEmailAPIView


urlpatterns = [
    path("admin/", admin.site.urls),
    # path('Hospital/', obtener_Hospital, name='obtener_Hospital'),  # API de hospitales
    # path('register/', register, name='register'),  # API de registro
    # path('obtener_csrf/', obtener_csrf, name='obtener_csrf'),
    path("registrar_usuario/", registrar_paciente, name="registrar_paciente"),
    path("validar_usuario/", validar_paciente, name="validar_paciente"),
    path("insertar_usuario/", insertar_paciente, name="insertar_paciente"),
    path("login_usuario/", login_paciente, name="login_paciente"),
    path(
        "actualizar_usuario/<user_id>", actualizar_paciente, name="actualizar_paciente"
    ),
    path("borrar_usuario/<user_id>", borrar_paciente, name="borrar_paciente"),
    path("lista_usuarios/", lista_pacientes, name="lista_pacientes"),
    path("obtener_usuario/<user_id>", obtener_paciente, name="obtener_paciente"),
    # my apis
    path("categories", get_cat_sub),
    path("recipes", get_recipes),
    path("recipes/<user_id>", get_recipes_by_patient_id),
    path("recipes/<doctor_id>", get_recipes_by_doctor_id),
    # path('send-email/', SendEmailAPIView.as_view(), name='send-email'),
]
