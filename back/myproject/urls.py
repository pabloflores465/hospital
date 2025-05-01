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
from django.urls import path, include

# from myproject.views import obtener_Hospital  # Importar las vistas
# from myproject.views import register
# from myproject.views import obtener_csrf
from .views import (
    actualizar_paciente,
    activar_usuario,
    borrar_paciente,
    insertar_paciente,
    login_paciente,
    lista_pacientes,
    obtener_paciente,
    registrar_paciente,
    validar_paciente,
    obtener_recetas_usuario,
    # Asegúrate de que estas funciones realmente existen en views.py
    # Si no existen, deben ser comentadas o eliminadas
    # insertar_medicamentos,
    # obtener_medicamentos,
    # obtener_usuarios_por_rol,
    # obtener_usuario_por_id,
    # modificar_doctor,
    # obtener_servicios,
    # filtrar_servicios,
    # crear_receta,
    # obtener_recetas,
    # crear_cita,
    # obtener_citas,
    # actualizar_cita,
    # obtener_categorias,
    # obtener_subcategorias,
    # delete_recipe,
    # delete_category,
    # delete_subcategory,
)

from .myfunctions.categories import get_cat_sub
from .myfunctions.recipes import (
    get_recipes,
    get_recipes_by_patient_id,
    get_recipes_by_doctor_id,
    save_recipe,
    get_recipe_detail,
    send_recipe_by_email,
    get_recipes_by_email,
)

from .myfunctions.services import get_all_services
from .myfunctions.doctors import get_doctors, get_doctor_count
from .myfunctions.patients import get_patient_count, get_users
from .myfunctions.appointments import get_appointments, get_appointments_by_doctor_identifier, get_appointments_by_patient_identifier
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
    get_service_by_id,
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
from .myfunctions.medical_records import (
    create_medical_record,
    add_medical_procedure,
    add_comment,
    get_patient_record,
    upload_attachment,
    get_attachment,
    get_doctor_patients,
)

# Eliminamos la importación errónea
# from myproject.myfunctions.user import register, login, send_messagefrom .myfunctions.appointments_crud import (
from .myfunctions.appointments_crud import (
    create_appointment,
    update_appointment,
    delete_appointment,
    list_appointments,
    complete_appointment,
)
from .myfunctions.history import (
    get_history,
    post_history,
    put_moderation_history,
    put_audit_history,
)
from .myfunctions.mission import (
    get_mission,
    post_mission,
    put_moderation_mission,
    put_audit_mission,
)

from .myfunctions.vision import (
    get_vision,
    post_vision,
    put_moderation_vision,
    put_audit_vision,
)

from .myfunctions.contact import (
    get_contact,
    post_contact,
    put_moderation_contact,
    put_audit_contact,
)

from .myfunctions.faq import get_faq, post_faq, put_moderation_faq, put_audit_faq

from .myfunctions.moderation import clear_history, get_changes

from .myfunctions.audit import get_all_changes

from .myfunctions.reports import doctor_appointments_report, medicines_report, rejected_users_report
from .myfunctions.user_data_export import export_user_data, import_user_data
from .myfunctions.doctors_api import list_doctors

# from myproject.views import SendEmailAPIView


urlpatterns = [
    path("admin/", admin.site.urls),
    # path('Hospital/', obtener_Hospital, name='obtener_Hospital'),  # API de hospitales
    path("register/", registrar_paciente, name="register"),
    path("login_usuario/", login_paciente, name="login"),
    # path('api/send-msg/<int:chat_id>/', send_message, name='send_message'),  # Comentamos esta ruta que usa una función que no existe
    # path('obtener_csrf/', obtener_csrf, name='obtener_csrf'),
    path("registrar_usuario/", registrar_paciente, name="registrar_paciente"),
    path("insertar_usuario/", insertar_paciente, name="insertar_paciente"),
    path("login_usuario/", login_paciente, name="login_paciente"),
    path(
        "actualizar_usuario/<user_id>", actualizar_paciente, name="actualizar_paciente"
    ),
    path("activar_usuario/<user_id>", activar_usuario, name="activar_usuario"),
    path("borrar_usuario/<user_id>", borrar_paciente, name="borrar_paciente"),
    path("lista_usuarios/", lista_pacientes, name="lista_pacientes"),
    path("obtener_usuario/<user_id>", obtener_paciente, name="obtener_paciente"),
    path(
        "recetas/usuario/<user_id>",
        obtener_recetas_usuario,
        name="obtener_recetas_usuario",
    ),
    # my apis
    path("categories", get_cat_sub),
    path("recipes", get_recipes),
    path("recipes/doctor/<user_id>", get_recipes_by_doctor_id),
    path("recipes/patient/<user_id>", get_recipes_by_patient_id),
    path("recipes/email/<str:email>", get_recipes_by_email, name="get_recipes_by_email"),
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
    # path("appointments", get_appointments),
    # path("appointments/patient/<patient_id>", get_appointments),
    # path("appointments/doctor/<doctor_id>", get_appointments),
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
    path("api/services/create/", create_service),
    path("api/services/<str:service_id>/update/", update_service),
    path("api/services/<str:service_id>/delete/", delete_service),
    path("api/services/<str:service_id>/", get_service_by_id),
    path("api/services/", get_services),
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
    path("api/appointments/doctor/<str:doctor_identifier>/", get_appointments_by_doctor_identifier, name="get_appointments_by_doctor_identifier"),
    path("api/appointments/", list_appointments),
    path("api/appointments/create/", create_appointment),
    path("api/appointments/<str:appointment_id>/update/", update_appointment),
    path("api/appointments/<str:appointment_id>/delete/", delete_appointment),
    path("api/appointments/<str:appointment_id>/complete/", complete_appointment),
    # Rutas para la ficha histórica
    path(
        "medical-records/create/", create_medical_record, name="create_medical_record"
    ),
    path(
        "medical-records/procedure/add/",
        add_medical_procedure,
        name="add_medical_procedure",
    ),
    path("medical-records/comment/add/", add_comment, name="add_comment"),
    path(
        "medical-records/patient/<str:patient_id>/",
        get_patient_record,
        name="get_patient_record",
    ),
    path(
        "medical-records/attachment/upload/",
        upload_attachment,
        name="upload_attachment",
    ),
    path(
        "medical-records/attachment/<str:attachment_id>/",
        get_attachment,
        name="get_attachment",
    ),
    path(
        "medical-records/doctor/<str:doctor_id>/patients/",
        get_doctor_patients,
        name="get_doctor_patients",
    ),
    path("history/", get_history),
    path("history/update/", post_history),
    path("history/moderation/", put_moderation_history),
    path("history/audit/", put_audit_history),
    path("mission/", get_mission),
    path("mission/update/", post_mission),
    path("mission/moderation/", put_moderation_mission),
    path("mission/audit/", put_audit_mission),
    path("vision/", get_vision),
    path("vision/update/", post_vision),
    path("vision/moderation/", put_moderation_vision),
    path("vision/audit/", put_audit_vision),
    path("contact/", get_contact),
    path("contact/update/", post_contact),
    path("contact/moderation/", put_moderation_contact),
    path("contact/audit/", put_audit_contact),
    path("faq/", get_faq),
    path("faq/update/", post_faq),
    path("faq/moderation/", put_moderation_faq),
    path("faq/audit/", put_audit_faq),
    path("moderation/clear/<page_id>", clear_history),
    path("moderation/", get_changes),
    path("audit", get_all_changes),
    path("api/reports/doctor-appointments", doctor_appointments_report, name="doctor_appointments_report"),
    path("api/appointments/patient/<str:patient_identifier>/", get_appointments_by_patient_identifier, name="get_appointments_by_patient_identifier"),
    path("api/reports/medicines", medicines_report),
    path("api/reports/rejected-users", rejected_users_report),
    path("api/users/export", export_user_data, name="export_user_data"),
    path("api/users/import", import_user_data, name="import_user_data"),
    path("api/doctors/list", list_doctors, name="list_doctors"),
]
