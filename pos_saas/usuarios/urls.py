from django.urls import path
from .views import (
    GoogleLoginView,
    LoginView,
    ReenviarVerificacionView,
    RegistroUsuarioView,
    VerificarCorreoView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('login-google/', GoogleLoginView.as_view(), name='login_google'),
    path('registro/', RegistroUsuarioView.as_view(), name='registro_usuario'),
    path('verificar-correo/', VerificarCorreoView.as_view(), name='verificar_correo'),
    path('reenviar-verificacion/', ReenviarVerificacionView.as_view(), name='reenviar_verificacion'),
]
