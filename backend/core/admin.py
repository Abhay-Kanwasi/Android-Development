from django.contrib import admin

from core.models import AdPlacement, Reward, VideoTask, QuizQuestion
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Sum

# Register your models here.
admin.site.register(VideoTask)
admin.site.register(QuizQuestion)

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_total_points')

    def get_total_points(self, obj):
        # Calculates the sum of points from the related Reward model
        total = obj.rewards.aggregate(total=Sum('points'))['total']
        return total or 0
    
    get_total_points.short_description = 'Total Points'

@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'created_at')
    list_filter = ('user',)

@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ('placement_key', 'ad_format', 'is_enabled', 'points_reward')