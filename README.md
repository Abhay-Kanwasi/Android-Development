# BitLabs API-First Implementation

## Overview
This implementation uses BitLabs REST API directly without the problematic SDK, ensuring security through server-to-server callbacks and providing a maintainable, production-ready solution.

## Architecture

```
[React Native App] → [Django Backend] → [BitLabs API]
                ↑                    ←  [BitLabs S2S Callbacks]
                └── [Secure Rewards Processing]
```

## Features

- ✅ **Security**: Server-to-server callback verification with HMAC signatures
- ✅ **Scalability**: Django REST API backend with proper authentication
- ✅ **User Experience**: Clean React Native UI with real-time balance updates
- ✅ **Data Integrity**: Comprehensive transaction tracking and audit trails
- ✅ **Production Ready**: Error handling, logging, and monitoring capabilities

## Project Structure

```
MyApp/
├── backend/
│   ├── bitlabs_project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── bitlabs_app/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── services/
│   │       └── bitlabs_service.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── services/
    │   └── ApiService.js
    ├── components/
    │   └── SurveyCard.js
    └── screens/
        └── SurveysScreen.js
```

## Setup Instructions

### Backend Setup (Django)

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv bitlabs_env
   source bitlabs_env/bin/activate  # On Windows: bitlabs_env\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your BitLabs credentials
   ```

4. **Database Setup**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run Development Server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup (React Native)

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install @react-native-async-storage/async-storage
   ```

2. **Update API Base URL**
   ```javascript
   // In services/ApiService.js, update:
   this.baseUrl = 'http://your-django-backend.com';
   ```

3. **Add to Your App**
   - Import and use `SurveysScreen` in your navigation
   - Implement authentication flow using `ApiService`

## BitLabs Configuration

### 1. Get BitLabs Credentials
- Sign up at [BitLabs Developer Portal](https://www.bitlabs.ai/)
- Obtain:
  - API Token
  - User ID
  - Secret Key

### 2. Configure Callback URL
Set your callback URL in BitLabs dashboard:
```
https://your-domain.com/api/bitlabs/callback/
```

### 3. Environment Variables
```env
BITLABS_API_TOKEN=your_api_token_here
BITLABS_USER_ID=your_user_id_here
BITLABS_SECRET=your_secret_key_here
BITLABS_BASE_URL=https://api.bitlabs.ai
```

## API Endpoints

### Authentication Required Endpoints

**GET /api/surveys/**
- Fetch available surveys for the authenticated user
- Returns: surveys list, user balance, total earnings

**POST /api/surveys/start/**
- Start a survey for the authenticated user
- Body: `{"survey_id": "12345"}`
- Returns: survey URL and click ID

**GET /api/dashboard/**
- Get user dashboard data
- Returns: profile info, recent completions, transactions

### Webhook Endpoint

**POST /api/bitlabs/callback/**
- Receives S2S callbacks from BitLabs
- Verifies HMAC signature
- Updates user balances and transaction records

## Security Features

### 1. HMAC Signature Verification
```python
def verify_callback_signature(self, payload: str, signature: str) -> bool:
    expected_signature = hmac.new(
        self.secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)
```

### 2. Token-Based Authentication
- Django REST Framework Token Authentication
- Secure token storage in React Native AsyncStorage
- Automatic token refresh handling

### 3. CORS Configuration
- Configured for React Native development
- Restrictive CORS policy for production

## Database Schema

### UserProfile
- Links Django User to BitLabs user ID
- Tracks available balance and total earnings
- Created automatically on first survey fetch

### SurveyCompletion
- Tracks individual survey attempts
- Stores click IDs for callback matching
- Status tracking (pending/completed/rejected)

### Transaction
- Audit trail for all balance changes
- Links to survey completions
- Supports multiple transaction types

## Error Handling

### Backend
- Comprehensive logging with different levels
- Graceful API error responses
- Database transaction rollbacks on errors

### Frontend
- Network error handling with user feedback
- Loading states and refresh controls
- Fallback for URL opening failures

## Production Deployment

### Backend Deployment
1. **Environment Setup**
   ```bash
   pip install gunicorn
   gunicorn bitlabs_project.wsgi:application
   ```

2. **Database Migration**
   ```bash
   python manage.py collectstatic
   python manage.py migrate --run-syncdb
   ```

3. **Nginx Configuration** (example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Frontend Deployment
- Build for production: `npx react-native run-android --variant=release`
- Update API base URL to production server
- Configure proper authentication flow

## Monitoring and Analytics

### Logging
- Django logging configured for file and console output
- BitLabs service logs all API interactions
- Callback processing logs for debugging

### Admin Interface
- Django admin for user management
- Survey completion tracking
- Transaction history review

### Metrics to Track
- Survey completion rates
- User engagement patterns
- Revenue per user
- API error rates

## Testing

### Backend Tests
```bash
python manage.py test bitlabs_app
```

### Frontend Tests
```bash
npm test
```

## Troubleshooting

### Common Issues

1. **"Missing signature in callback"**
   - Verify BitLabs callback URL configuration
   - Check webhook headers in BitLabs dashboard

2. **"Survey already started"**
   - User attempting to start same survey twice
   - Clear survey completion records if needed

3. **"Failed to fetch surveys"**
   - Check BitLabs API credentials
   - Verify network connectivity
   - Review API rate limits

### Debug Mode
Set `DEBUG=True` in Django settings for detailed error messages.

### Logs Location
- Django logs: `backend/logs/django.log`
- Check Django admin for user activity

## Support and Maintenance

### Regular Tasks
- Monitor callback processing logs
- Review user balance discrepancies
- Update BitLabs API integration as needed
- Performance optimization based on usage patterns

### Backup Strategy
- Regular database backups
- Environment variable backup
- Code repository maintenance

## License
This implementation is provided as-is for educational and commercial use.

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Submit pull request

---

For questions or support, please refer to the BitLabs documentation or create an issue in the repository.
