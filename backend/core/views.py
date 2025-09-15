from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.views import View

import json
import uuid
import logging

from core.videos.permissions import IsAdminOrReadOnly
from core.services.bitlabs_service import BitLabsService

from .models import (
    AdPlacement, VideoTask, QuizQuestion, VideoWatchSession, QuizResponse, Reward,
    UserProfile, SurveyCompletion, SurveyTransaction
)
from .serializers import (
    AdPlacementSerializer, VideoTaskSerializer, VideoCreateSerializer,
    VideoWatchSessionSerializer, QuizResponseInputSerializer, QuizResultSerializer, 
)

from django.contrib.auth.models import User

user = User.objects.get(username="abhay")
print(user)

logger = logging.getLogger(__name__)

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

@api_view(['GET'])
def get_placements_view(request):
    """
    Returns a dictionary of all enabled ad placements, keyed by their placement_key.
    """
    placements = AdPlacement.objects.filter(is_enabled=True)
    data = {
        p.placement_key: AdPlacementSerializer(p).data 
        for p in placements
    }
    print("google ad data", data)
    return Response(data)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_surveys(request):
    """Fetch available surveys for authenticated user"""
    try:
        user_profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'bitlabs_user_id': str(uuid.uuid4())}
        )
        
        bitlabs_service = BitLabsService()
        surveys_data = bitlabs_service.get_surveys(user_profile.bitlabs_user_id)
        print(f'surveys data {len(surveys_data)}')
        if surveys_data is None:
            return Response(
                {'error': 'Failed to fetch surveys'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Filter and format surveys for mobile
        surveys = surveys_data['data'].get('surveys', [])
        formatted_surveys = []
        # print(f'surveys {surveys}')
        for survey in surveys:
            formatted_surveys.append({
                "id": survey.get("id"),
                "reward": int(survey.get("value", 0)),  # BitLabs returns "value" as string → convert to int
                "duration": survey.get("loi", 0),       # length of interview
                "category": survey.get("category", {}).get("name", "General"),
                "rating": survey.get("rating", 0),
                "conversion_level": survey.get("conversion_level", "medium"),  # may not always exist
                "click_url": survey.get("click_url"),
                "cpi": float(survey.get("cpi", 0)),     # cost per install, convert string → float
                "country": survey.get("country", "Unknown"),
                "language": survey.get("language", "en"),
            })
        print(f'surveys {surveys}\n user balance {float(user_profile.available_balance)}\n total earning {float(user_profile.total_earnings)}')
        return Response({
            'surveys': formatted_surveys,
            'user_balance': float(user_profile.available_balance),
            'total_earnings': float(user_profile.total_earnings),
        })
        
    except Exception as e:
        logger.error(f"Error in get_surveys: {e}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def start_survey(request):
    """Generate survey URL for user to start survey"""
    try:
        survey_id = request.data.get('survey_id')
        if not survey_id:
            return Response({'error': 'survey_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_profile = UserProfile.objects.get(user=user)
        click_id = str(uuid.uuid4())
        
        # Create survey completion record
        survey_completion, created = SurveyCompletion.objects.get_or_create(
            user_profile=user_profile,
            survey_id=survey_id,
            defaults={'click_id': click_id}
        )
        
        if not created:
            return Response({'error': 'Survey already started'}, status=status.HTTP_400_BAD_REQUEST)
        
        bitlabs_service = BitLabsService()
        surveys = bitlabs_service.get_surveys(user_profile.bitlabs_user_id)
        if not surveys:
            survey_completion.delete()  # Cleanup
            return Response({'error': 'Failed to fetch surveys'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Find the survey with the matching survey_id
        survey = next((s for s in surveys['data']['surveys'] if s['id'] == survey_id), None)
        if not survey:
            survey_completion.delete()  # Cleanup
            return Response({'error': 'Survey not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Redirect to the survey's click_url
        return Response({'survey_url': survey['click_url'], 'click_id': click_id})
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in start_survey: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data"""
    try:
        user_profile = UserProfile.objects.get(user=user)
        
        recent_completions = SurveyCompletion.objects.filter(
            user_profile=user_profile
        ).order_by('-started_at')[:10]
        
        recent_transactions = SurveyTransaction.objects.filter(
            user_profile=user_profile
        ).order_by('-created_at')[:10]
        
        completion_data = []
        for completion in recent_completions:
            completion_data.append({
                'survey_id': completion.survey_id,
                'status': completion.status,
                'reward_amount': float(completion.reward_amount) if completion.reward_amount else 0,
                'started_at': completion.started_at.isoformat(),
                'completed_at': completion.completed_at.isoformat() if completion.completed_at else None,
            })
        
        transaction_data = []
        for transaction in recent_transactions:
            transaction_data.append({
                'type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'description': transaction.description,
                'created_at': transaction.created_at.isoformat(),
            })
        
        return Response({
            'user_profile': {
                'username': user_profile.user.username,
                'available_balance': float(user_profile.available_balance),
                'total_earnings': float(user_profile.total_earnings),
            },
            'recent_completions': completion_data,
            'recent_transactions': transaction_data,
        })
        
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'User profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in user_dashboard: {e}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@method_decorator(csrf_exempt, name='dispatch')
class BitLabsCallbackView(View):
    """Handle S2S callbacks from BitLabs"""
    
    def post(self, request):
        try:
            # Get signature from header
            signature = request.META.get('HTTP_X_BITLABS_SIGNATURE')
            if not signature:
                logger.warning("Missing signature in callback")
                return JsonResponse({'error': 'Missing signature'}, status=400)
            
            # Get payload
            payload = request.body.decode('utf-8')
            
            # Verify signature
            bitlabs_service = BitLabsService()
            if not bitlabs_service.verify_callback_signature(payload, signature):
                logger.warning("Invalid signature in callback")
                return JsonResponse({'error': 'Invalid signature'}, status=401)
            
            # Parse callback data
            callback_data = json.loads(payload)
            
            # Process callback
            self._process_callback(callback_data)
            
            return JsonResponse({'status': 'success'})
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON in callback")
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error processing callback: {e}")
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    def _process_callback(self, data):
        """Process the callback data and update user rewards"""
        event_type = data.get('type')
        user_id = data.get('uid')
        survey_id = data.get('survey_id')
        click_id = data.get('click_id')
        reward = data.get('reward', 0)
        
        try:
            user_profile = UserProfile.objects.get(bitlabs_user_id=user_id)
            
            if event_type == 'survey_completed':
                # Update survey completion
                survey_completion = SurveyCompletion.objects.get(
                    user_profile=user_profile,
                    click_id=click_id
                )
                survey_completion.status = 'completed'
                survey_completion.reward_amount = reward
                survey_completion.completed_at = timezone.now()
                survey_completion.save()
                
                # Update user balance
                user_profile.available_balance += reward
                user_profile.total_earnings += reward
                user_profile.save()
                
                # Create transaction record
                SurveyTransaction.objects.create(
                    user_profile=user_profile,
                    transaction_type='survey_reward',
                    amount=reward,
                    description=f'Survey {survey_id} completion reward',
                    survey_completion=survey_completion
                )
                
                logger.info(f"Processed survey completion for user {user_id}: ${reward}")
                
            elif event_type == 'survey_rejected':
                survey_completion = SurveyCompletion.objects.get(
                    user_profile=user_profile,
                    click_id=click_id
                )
                survey_completion.status = 'rejected'
                survey_completion.save()
                
                logger.info(f"Survey rejected for user {user_id}")
                
        except UserProfile.DoesNotExist:
            logger.error(f"User profile not found for BitLabs user ID: {user_id}")
        except SurveyCompletion.DoesNotExist:
            logger.error(f"Survey completion not found for click ID: {click_id}")
        except Exception as e:
            logger.error(f"Error processing callback for user {user_id}: {e}")