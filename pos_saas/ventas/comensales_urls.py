from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComensalViewSet

router = DefaultRouter()
router.register(r'', ComensalViewSet, basename='comensal')

urlpatterns = [
    path('', include(router.urls)),
]
