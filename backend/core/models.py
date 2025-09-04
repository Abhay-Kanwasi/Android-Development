from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User


class VideoTask(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    youtube_url = models.URLField()
    yt_video_id = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

class QuizQuestion(models.Model):
    video = models.ForeignKey(VideoTask, related_name='questions', on_delete=models.CASCADE)
    question_text = models.TextField()
    correct_answer = models.TextField()
    # optional weight/points per question
    points = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Q{self.id} for {self.video_id}"

class VideoWatchSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watch_sessions')
    video = models.ForeignKey(VideoTask, on_delete=models.CASCADE)
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    watch_duration = models.PositiveIntegerField(default=0)   # seconds watched (latest)
    percent_viewed = models.FloatField(default=0.0)
    completed = models.BooleanField(default=False)

    def mark_complete(self):
        self.completed = True
        self.ended_at = timezone.now()
        self.save()

class QuizResponse(models.Model):
    session = models.ForeignKey(VideoWatchSession, related_name='responses', on_delete=models.CASCADE)
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    user_answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    points_awarded = models.IntegerField(default=0)
    answered_at = models.DateTimeField(default=timezone.now)

class Reward(models.Model):
    user = models.ForeignKey(User, related_name='rewards', on_delete=models.CASCADE)
    session = models.ForeignKey(VideoWatchSession, null=True, blank=True, on_delete=models.SET_NULL)
    points = models.IntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    paid_out = models.BooleanField(default=False)

class AdPlacement(models.Model):
    AD_FORMAT_CHOICES = [
        ('REWARDED', 'Rewarded'),
        ('BANNER', 'Banner'),
        ('INTERSTITIAL', 'Interstitial'),
    ]

    placement_key = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="A unique key for the app to fetch, e.g., 'home_screen_rewarded'"
    )
    ad_format = models.CharField(max_length=20, choices=AD_FORMAT_CHOICES)
    is_enabled = models.BooleanField(default=True)
    points_reward = models.PositiveIntegerField(
        default=0, 
        help_text="Points awarded (only for 'Rewarded' format)"
    )
    ad_unit_id = models.CharField(max_length=255)

    def __str__(self):
        return self.placement_key
