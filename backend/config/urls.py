from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "CreatorPilot Backend API"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health-check'),
    path('api/auth/', include('apps.identity.presentation.urls')),
    path('api/', include('apps.productivity.presentation.urls')),
    path('api/', include('apps.creative.presentation.urls')),
]
