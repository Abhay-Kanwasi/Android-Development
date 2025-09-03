from django.db.models import Sum
from django.contrib.auth.models import User

def get_user_total_points(user_id):
    """
    Calculates the total points for a user by summing all their rewards.
    """
    try:
        user = User.objects.get(pk=user_id)
        # 'rewards' is the related_name from the Reward model's user field
        total = user.rewards.aggregate(total_points=Sum('points'))['total_points']
        return total or 0
    except User.DoesNotExist:
        return 0
