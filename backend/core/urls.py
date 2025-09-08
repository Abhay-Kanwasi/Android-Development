from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    VideoTaskViewSet, award_ad_points_view, get_placements_view, start_video_session, update_watch_progress,
    complete_video_session, submit_quiz_responses, get_surveys, start_survey, user_dashboard, BitLabsCallbackView
)

router = DefaultRouter()
router.register(r'api/video-tasks', VideoTaskViewSet, basename='video-tasks')

urlpatterns = [
    path('', include(router.urls)),
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Youtube Video Integration
    path('api/start-video-session/', start_video_session, name='start-video-session'),
    path('api/update-watch-progress/<int:session_id>/', update_watch_progress, name='update-watch-progress'),
    path('api/complete-video-session/<int:session_id>/', complete_video_session, name='complete-video-session'),
    path('api/submit-quiz-responses/', submit_quiz_responses, name='submit-quiz-responses'),

    # AdMob Integration
    path('api/award-ad-points/', award_ad_points_view, name='award-ad-points'),
    path('api/ad-placements/', get_placements_view, name='ad-placements'),
    # BitLabs Survey Integration
    path('api/surveys/', get_surveys, name='get_surveys'),
    path('api/surveys/start/', start_survey, name='start_survey'),
    path('api/dashboard/', user_dashboard, name='user_dashboard'),
    path('api/bitlabs/callback/', BitLabsCallbackView.as_view(), name='bitlabs_callback'),
]
