from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from core.videos.permissions import IsAdminOrReadOnly

from .models import VideoTask, QuizQuestion, VideoWatchSession, QuizResponse, Reward
from .serializers import (
    VideoTaskSerializer, VideoCreateSerializer,
    VideoWatchSessionSerializer, QuizResponseInputSerializer, QuizResultSerializer
)

from django.contrib.auth.models import User

user = User.objects.get(username="abhay")
print(user)

# Video tasks viewset
class VideoTaskViewSet(viewsets.ModelViewSet):
    queryset = VideoTask.objects.all().order_by('-created_at')
    permission_classes = [IsAdminOrReadOnly]
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VideoCreateSerializer
        return VideoTaskSerializer

# Start session
@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def start_video_session(request):
    print("start video session")
    task_id = request.data.get('task_id')
    task = get_object_or_404(VideoTask, id=task_id)
    # return existing open session if exists
    session, created = VideoWatchSession.objects.get_or_create(
        user=user,
        video=task,
        completed=False,
        defaults={'started_at': timezone.now()}
    )
    serializer = VideoWatchSessionSerializer(session)
    return Response(serializer.data)

# Update progress
@api_view(['PUT'])
# @permission_classes([IsAuthenticated])
def update_watch_progress(request, session_id):
    print("update watch progress")
    session = get_object_or_404(VideoWatchSession, id=session_id, user=user)
    watch_duration = request.data.get('watch_duration')
    percent_viewed = request.data.get('percent_viewed')
    if watch_duration is not None:
        try:
            wd = int(watch_duration)
            if wd > session.watch_duration:
                session.watch_duration = wd
        except:
            pass
    if percent_viewed is not None:
        try:
            pv = float(percent_viewed)
            session.percent_viewed = max(session.percent_viewed, pv)
        except:
            pass
    session.save()
    return Response({'status': 'ok'})

# Complete session
@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def complete_video_session(request, session_id):
    print("in complete video session")
    session = get_object_or_404(VideoWatchSession, id=session_id, user=user)
    if not session.completed:
        session.completed = True
        session.ended_at = timezone.now()
        session.save()
    return Response({'status': 'completed'})

# Submit quiz responses and grade
@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def submit_quiz_responses(request):
    print("In submit quiz response")
    serializer_in = QuizResponseInputSerializer(many=True, data=request.data.get('responses', []))
    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'detail': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
    session = get_object_or_404(VideoWatchSession, id=session_id, user=user)
    if not serializer_in.is_valid():
        return Response(serializer_in.errors, status=status.HTTP_400_BAD_REQUEST)

    responses_data = serializer_in.validated_data
    total_questions = 0
    correct_answers = 0
    total_points_awarded = 0

    with transaction.atomic():
        for r in responses_data:
            q_id = r['question']
            user_answer = r['user_answer'].strip()
            question = get_object_or_404(QuizQuestion, id=q_id, video=session.video)
            total_questions += 1
            is_correct = (user_answer.lower().strip() == question.correct_answer.lower().strip())
            points = question.points if is_correct else 0
            if is_correct:
                correct_answers += 1
                total_points_awarded += points
            QuizResponse.objects.create(
                session=session,
                question=question,
                user_answer=user_answer,
                is_correct=is_correct,
                points_awarded=points
            )
        # Award base completion points if session completed or mark completed now
        completion_points = 1
        if not session.completed:
            session.completed = True
            session.ended_at = timezone.now()
            session.save()
        # create reward record (points from quiz + completion)
        reward_total = total_points_awarded + completion_points
        if reward_total > 0:
            Reward.objects.create(user=user, session=session, points=reward_total)
    quiz_score = (correct_answers / total_questions * 100) if total_questions else 0.0

    result = {
        'quiz_score': round(quiz_score, 2),
        'correct_answers': correct_answers,
        'total_questions': total_questions,
        'total_points_awarded': reward_total
    }
    serializer_out = QuizResultSerializer(result)
    return Response(serializer_out.data)


# Google Ad mob
@api_view(['POST'])
def award_ad_points_view(request):
    try:
        """
        Creates a Reward entry for the authenticated user for watching a rewarded ad.
        Expects {'points': <amount>} in the request body.
        """
        points_to_add = request.data.get('points')
        print(f'points to add {points_to_add}')

        if not isinstance(points_to_add, int) or points_to_add <= 0:
            return Response(
                {'error': 'A positive integer for "points" must be provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a new Reward object instead of updating the user directly
        Reward.objects.create(
            user=user,
            points=points_to_add,
            session=None  # This reward is not tied to a video session
        )

        return Response(
            {'message': f'{points_to_add} points awarded successfully.'},
            status=status.HTTP_200_OK
        )
    except Exception as error:
        print(f'Error {error}')