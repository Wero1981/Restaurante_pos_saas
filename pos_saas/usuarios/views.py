from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes as permission_decorator
from .serializers import RegistroSerializer
from drf_spectacular.utils import extend_schema

class RegistroUsuarioView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    @extend_schema(
        request=RegistroSerializer,
        responses={200: {'type': 'object', 'properties': {
            'refresh': {'type': 'string'},
            'access': {'type': 'string'},
        }}}
    )
    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })