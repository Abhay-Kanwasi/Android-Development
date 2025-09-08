# BitLabs Integration - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv bitlabs_env
source bitlabs_env/bin/activate  # Windows: bitlabs_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env file with your BitLabs credentials

# Setup database
python manage.py makemigrations bitlabs_app
python manage.py migrate
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Step 2: Frontend Setup
```bash
cd frontend

# Install AsyncStorage for React Native
npm install @react-native-async-storage/async-storage

# The BitLabs service uses your existing API base URL (http://10.0.2.2:8000)
# No additional configuration needed for the API URL
```

### Step 3: BitLabs Configuration
1. Go to [BitLabs Developer Portal](https://www.bitlabs.ai/)
2. Get your API credentials
3. Set callback URL: `http://localhost:8000/api/bitlabs/callback/`
4. Update your `.env` file with credentials

### Step 4: Test the Integration
1. Start Django server: `python manage.py runserver`
2. Run React Native app: `npx react-native run-android`
3. Test the SurveysScreen component

## 📱 React Native Integration

### Add to your app:
```typescript
// App.tsx
import SurveysScreen from './src/components/SurveysScreen';
// or use the example component
import BitLabsExample from './src/components/BitLabsExample';

// Use in your navigation or as a screen
<SurveysScreen />
```

### Authentication Setup:
```typescript
// Login example
import bitLabsService from './src/services/bitlabs';

const handleLogin = async (username: string, password: string): Promise<void> => {
  try {
    const response = await bitLabsService.login(username, password);
    // Handle successful login
    console.log('Login successful:', response.user);
  } catch (error) {
    // Handle login error
    console.error('Login failed:', error);
  }
};
```

## 🔧 Key Files Modified

### Backend Files Created:
- `backend/bitlabs_app/models.py` - Database models
- `backend/bitlabs_app/views.py` - API endpoints
- `backend/bitlabs_app/services/bitlabs_service.py` - BitLabs API client
- `backend/bitlabs_project/settings.py` - Django configuration

### Frontend Files Created:
- `frontend/src/services/bitlabs.ts` - BitLabs service extending your existing API
- `frontend/src/components/SurveyCard.tsx` - Survey display component
- `frontend/src/components/SurveysScreen.tsx` - Main surveys screen
- `frontend/src/components/BitLabsExample.tsx` - Integration example
- `frontend/src/types/bitlabs.ts` - BitLabs type definitions

## 🛠️ Development Tips

### Backend Development:
- Use Django admin at `http://localhost:8000/admin/` to manage users
- Check logs in `backend/logs/django.log`
- Test callbacks with tools like ngrok for local development

### Frontend Development:
- Enable debugging in ApiService for network requests
- Use React Native Debugger for better debugging experience
- Test on both iOS and Android platforms

## 📊 Production Checklist

- [ ] Set `DEBUG=False` in Django settings
- [ ] Configure proper database (PostgreSQL recommended)
- [ ] Set up HTTPS for callback URL
- [ ] Configure CORS for production domains
- [ ] Set up logging and monitoring
- [ ] Test callback signature verification
- [ ] Implement user authentication flow
- [ ] Add error tracking (Sentry, etc.)

## 🆘 Common Issues

**"Failed to fetch surveys"**
- Check BitLabs API credentials in `.env`
- Verify Django server is running
- Check network connectivity

**"Missing signature in callback"**
- Verify callback URL in BitLabs dashboard
- Check HMAC secret configuration

**React Native build issues**
- Clear cache: `npx react-native start --reset-cache`
- Rebuild: `cd android && ./gradlew clean && cd ..`

## 📞 Support

For technical issues:
1. Check the logs (Django admin or console)
2. Review BitLabs API documentation
3. Test endpoints with tools like Postman
4. Check React Native debugger for frontend issues

---
✅ **Ready to go!** Your BitLabs integration should now be working with secure server-to-server callbacks and a clean mobile interface.
