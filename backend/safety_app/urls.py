from django.urls import path
from . import views

urlpatterns = [
    path('api/journey/start', views.start_journey, name='start_journey'),
    path('api/journey/update', views.update_location, name='update_location'),
    path('api/sos', views.trigger_sos, name='trigger_sos'),
    path('api/journey/latest', views.get_latest_journey, name='get_latest_journey'),
]

