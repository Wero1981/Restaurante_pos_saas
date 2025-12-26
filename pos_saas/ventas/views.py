from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import Venta
from .serializers import VentaSerializer

class VentaViewSet(ModelViewSet):
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Venta.objects.filter(restaurante=self.request.restaurante)
