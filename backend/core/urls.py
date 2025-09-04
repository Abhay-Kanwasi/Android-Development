from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    VideoTaskViewSet, award_ad_points_view, get_placements_view, start_video_session, update_watch_progress,
    complete_video_session, submit_quiz_responses
)

router = DefaultRouter()
router.register(r'api/video-tasks', VideoTaskViewSet, basename='video-tasks')

urlpatterns = [
    path('', include(router.urls)),
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/start-video-session/', start_video_session, name='start-video-session'),
    path('api/update-watch-progress/<int:session_id>/', update_watch_progress, name='update-watch-progress'),
    path('api/complete-video-session/<int:session_id>/', complete_video_session, name='complete-video-session'),
    path('api/submit-quiz-responses/', submit_quiz_responses, name='submit-quiz-responses'),
    path('api/award-ad-points/', award_ad_points_view, name='award-ad-points'),
    path('api/ad-placements/', get_placements_view, name='ad-placements'),
]
