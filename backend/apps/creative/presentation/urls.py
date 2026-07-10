from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MediaAssetViewSet, MediaFolderViewSet

router = DefaultRouter()
router.register(r'media', MediaAssetViewSet, basename='media')
router.register(r'folders', MediaFolderViewSet, basename='folder')

urlpatterns = [
    path('', include(router.urls)),
]
