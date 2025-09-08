from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db.models import Sum

from core.models import (
    AdPlacement, Reward, VideoTask, QuizQuestion, VideoWatchSession, QuizResponse,
    UserProfile, SurveyCompletion, SurveyTransaction
)

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_total_points')

    def get_total_points(self, obj):
        total = obj.rewards.aggregate(total=Sum('points'))['total']
        return total or 0
    get_total_points.short_description = 'Total Points'


# Unregister default User and register custom UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'created_at', 'paid_out')
    list_filter = ('user', 'paid_out', 'created_at')
    search_fields = ('user__username',)

@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ('placement_key', 'ad_format', 'is_enabled', 'points_reward')
    list_filter = ('is_enabled', 'ad_format')
    search_fields = ('placement_key',)

admin.site.register(VideoTask)
admin.site.register(QuizQuestion)
admin.site.register(VideoWatchSession)
admin.site.register(QuizResponse)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bitlabs_user_id', 'available_balance', 'total_earnings', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'bitlabs_user_id')
    readonly_fields = ('created_at',)

@admin.register(SurveyCompletion)
class SurveyCompletionAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'survey_id', 'status', 'reward_amount', 'started_at', 'completed_at')
    list_filter = ('status', 'started_at', 'completed_at')
    search_fields = ('user_profile__user__username', 'survey_id', 'click_id')
    readonly_fields = ('started_at', 'completed_at')

@admin.register(SurveyTransaction)
class SurveyTransactionAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'transaction_type', 'amount', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('user_profile__user__username', 'description')
    readonly_fields = ('created_at',)
