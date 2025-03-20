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
    save_recipe,
    get_recipe_detail,
    send_recipe_by_email,
)

from .myfunctions.services import get_all_services
from .myfunctions.doctors import get_doctors, get_doctor_count
from .myfunctions.patients import get_patient_count, get_users
from .myfunctions.appointments import get_appointments
from myproject.myfunctions.users import get_current_doctor
from myproject.myfunctions.medicines import get_principios_activos
from .myfunctions.comments import get_comments
from .myfunctions.comments import post_comment
from .myfunctions.services_ensurance import (
    get_services_ensurance,
    import_services_ensurance,
)
from .myfunctions.services_crud import (
    create_service,
    get_services,
    update_service,
    delete_service,
)
from .myfunctions.categories_crud import (
    create_category,
    get_categories,
    update_category,
    delete_category,
)
from .myfunctions.ensurances_crud import (
    create_ensurance,
    get_ensurances,
    update_ensurance,
    delete_ensurance,
)
from .myfunctions.subcategories_crud import (
    create_subcategory,
    get_subcategories,
    update_subcategory,
    delete_subcategory,
)
from .myfunctions.footer import get_footer
from .myfunctions.patient_services import get_patient_services


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
    path("recipes/doctor/<user_id>", get_recipes_by_doctor_id),
    path("recipes/patient/<user_id>", get_recipes_by_patient_id),
    path("recipes/save", save_recipe, name="save_recipe"),
    path("recipes/detail/<str:recipe_id>", get_recipe_detail, name="get_recipe_detail"),
    path(
        "recipes/send-email/<str:recipe_id>",
        send_recipe_by_email,
        name="send_recipe_by_email",
    ),
    # path('send-email/', SendEmailAPIView.as_view(), name='send-email'),
    # path("services", get_all_services),
    path("doctors", get_doctors),
    path("doctors/count", get_doctor_count),
    path("patients/count", get_patient_count),
    path("appointments", get_appointments),
    path("appointments/patient/<patient_id>", get_appointments),
    path("appointments/doctor/<doctor_id>", get_appointments),
    path("users", get_users),
    path("comments/<parent_id>", get_comments),
    path("addcomment/", post_comment),
    path("addcomment/<parent_id>", post_comment),
    path("users/current-doctor", get_current_doctor, name="get_current_doctor"),
    path(
        "medicines/principios-activos",
        get_principios_activos,
        name="get_principios_activos",
    ),
    path("api/services_ensurance/", get_services_ensurance),
    path("api/services_ensurance/import/", import_services_ensurance),
    path("api/services/", get_services),
    path("api/services/create/", create_service),
    path("api/services/<str:service_id>/update/", update_service),
    path("api/services/<str:service_id>/delete/", delete_service),
    path("api/categories/", get_categories),
    path("api/categories/create/", create_category),
    path("api/categories/<str:category_id>/update/", update_category),
    path("api/categories/<str:category_id>/delete/", delete_category),
    path("api/ensurances/", get_ensurances),
    path("api/ensurances/create/", create_ensurance),
    path("api/ensurances/<str:ensurance_id>/update/", update_ensurance),
    path("api/ensurances/<str:ensurance_id>/delete/", delete_ensurance),
    path("api/subcategories/", get_subcategories),
    path("api/subcategories/create/", create_subcategory),
    path("api/subcategories/<str:subcategory_id>/update/", update_subcategory),
    path("api/subcategories/<str:subcategory_id>/delete/", delete_subcategory),
    path("footer/", get_footer),
    path("patient/services/", get_patient_services),
]
