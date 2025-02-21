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
from myproject.views import insertar_paciente
from .views import obtener_Hospital
from myproject.views import SendEmailAPIView


urlpatterns = [
    path('admin/', admin.site.urls),
    # path('Hospital/', obtener_Hospital, name='obtener_Hospital'),  # API de hospitales
    # path('register/', register, name='register'),  # API de registro
    # path('obtener_csrf/', obtener_csrf, name='obtener_csrf'),
    path("insertar_usuario/", insertar_paciente, name="insertar_paciente"),
     path('obtener_Hospital/', obtener_Hospital, name='obtener_Hospital'),
    path('send-email/', SendEmailAPIView.as_view(), name='send-email'),
]