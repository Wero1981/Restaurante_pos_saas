from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegistroUsuarioView, LoginView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroUsuarioView.as_view(), name='registro_usuario'),
]