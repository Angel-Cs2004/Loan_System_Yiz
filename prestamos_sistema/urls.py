from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from django.urls import include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MiTokenObtainPairView


# Endpoints de la API, versionados bajo /api/v1/ para poder evolucionar sin romper
# a los clientes existentes (se podria sacar /api/v2/ en el futuro).
api_v1 = [
    path('login/', MiTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', include('users.urls')),
    path('catalogo/', include('catalogo.urls')),
    path('prestamos/', include('prestamos.urls')),
    path('auditoria/', include('auditoria.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/', include(api_v1)),
]
