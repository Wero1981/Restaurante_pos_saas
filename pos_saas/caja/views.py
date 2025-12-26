from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from serializers import CajaSerializer
from .models import Caja

class CajaViewSet(ModelViewSet):
    serializer_class = CajaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Caja.objects.filter(restaurante=self.request.restaurante)

    def perform_create(self, serializer):
        serializer.save(restaurante=self.request.restaurante)

    def partial_update(self, request, *args, **kwargs):
        caja = self.get_object()
        caja.fecha_cierre = now()
        caja.monto_final = request.data.get('monto_final')
        caja.save()
        return Response(self.get_serializer(caja).data)
