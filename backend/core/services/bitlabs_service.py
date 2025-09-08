# services/bitlabs_service.py

import requests
import hashlib
import hmac
import logging
from django.conf import settings
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class BitLabsService:
    def __init__(self):
        self.config = settings.BITLABS_CONFIG
        self.base_url = self.config['BASE_URL']
        self.app_token = self.config['APP_TOKEN']
        self.app_secret = self.config['APP_SECRET'] 
        self.s2s_secret = self.config['S2S_SECRET']
        
        logger.info(f"BitLabs Service initialized with base_url: {self.base_url}")
    
    def _get_headers(self, user_id: str) -> Dict[str, str]:
        """Get headers for BitLabs API requests"""
        headers = {
            'X-Api-Token': self.app_token,
            'X-User-Id': user_id,
            'Content-Type': 'application/json',
        }
        return headers
    
    def get_surveys(self, user_id: str, platform: str = 'MOBILE', os: str = 'ANDROID') -> Optional[Dict]:
        """Fetch available surveys for a user"""
        url = f"{self.base_url}/v2/client/surveys"
        params = {
            'platform': platform,
            'os': os,
        }
        headers = self._get_headers(user_id)
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error fetching surveys for user {user_id}: {e}")
            return None

    def get_survey_url(self, user_id: str, survey_id: str, click_id: str) -> Optional[str]:
        """Generate survey URL with click tracking"""
        url = f"{self.base_url}/v2/client/surveys/start"
        headers = self._get_headers(user_id)
        payload = {
            "survey_id": survey_id,
            "click_id": click_id
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get("link")  # API returns 'link' field
        except requests.RequestException as e:
            logger.error(f"Error getting survey URL: {e}")
            if e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            return None

        
    def verify_callback_signature(self, payload: str, signature: str) -> bool:
        """Verify S2S callback signature using S2S secret"""
        expected_signature = hmac.new(
            self.s2s_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_signature)
    
    def get_user_rewards(self, user_id: str) -> Optional[Dict]:
        """Get user's reward information"""
        # Correct endpoint: /v2/client/users/{user_id}
        url = f"{self.base_url}/v2/client/users/{user_id}"
        
        try:
            response = requests.get(url, headers=self._get_headers(user_id), timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error fetching user rewards: {e}")
            return None
