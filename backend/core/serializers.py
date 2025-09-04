from rest_framework import serializers
from .models import  AdPlacement, VideoTask, QuizQuestion, VideoWatchSession, QuizResponse, Reward

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'points']

class VideoTaskSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    class Meta:
        model = VideoTask
        fields = ['id', 'title', 'description', 'youtube_url', 'yt_video_id', 'questions', 'created_at']

class VideoCreateSerializer(serializers.ModelSerializer):
    # admin create with inline questions
    questions = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    print("Questions ", questions)

    class Meta:
        model = VideoTask
        fields = ['id', 'title', 'description', 'youtube_url', 'questions']

    def create(self, validated_data):
        questions = validated_data.pop('questions', [])
        video = VideoTask.objects.create(**validated_data)
        # try to extract yt id (simple)
        url = video.youtube_url
        import re
        m = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)', url)
        if m:
            video.yt_video_id = m.group(1)
            video.save()
        for q in questions:
            QuizQuestion.objects.create(
                video=video,
                question_text=q.get('question_text', ''),
                correct_answer=q.get('correct_answer', ''),
                points=q.get('points', 1)
            )
        return video

class VideoWatchSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoWatchSession
        fields = ['id', 'user', 'video', 'started_at', 'ended_at', 'watch_duration', 'percent_viewed', 'completed']
        read_only_fields = ['id', 'user', 'started_at', 'ended_at', 'completed']

class QuizResponseInputSerializer(serializers.Serializer):
    question = serializers.IntegerField()
    user_answer = serializers.CharField()

class QuizResultSerializer(serializers.Serializer):
    quiz_score = serializers.FloatField()
    correct_answers = serializers.IntegerField()
    total_questions = serializers.IntegerField()
    total_points_awarded = serializers.IntegerField()

class AdPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdPlacement
        fields = ('ad_format', 'is_enabled', 'points_reward', 'ad_unit_id')