from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublishItemViewSet, PublishPlatformViewSet

router = DefaultRouter()
router.register(r'publishing', PublishItemViewSet, basename='publishing')
router.register(r'publish-platforms', PublishPlatformViewSet, basename='publish-platform')

urlpatterns = [
    path('', include(router.urls)),
]
