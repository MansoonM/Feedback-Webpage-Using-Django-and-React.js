# feedback_project/urls.py
from django.contrib import admin
from django.urls import path, include
from api import views as api_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/feedback/', api_views.feedback_list_create, name='feedback_api'),
]
