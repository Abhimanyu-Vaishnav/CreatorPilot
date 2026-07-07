from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, NoteViewSet, KnowledgeItemViewSet, TaskViewSet, CalendarViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'knowledge', KnowledgeItemViewSet, basename='knowledge')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'calendar', CalendarViewSet, basename='calendar')

urlpatterns = [
    path('', include(router.urls)),
]
