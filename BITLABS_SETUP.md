# BitLabs Integration Setup

## 📱 What's Added to Your Existing Project

I've integrated BitLabs surveys into your existing Django and React Native project without creating any separate apps or projects.

### 🔧 Backend Changes (in your existing `core` app):

**Models Added to `core/models.py`:**
- `UserProfile` - Links users to BitLabs with earnings tracking
- `SurveyCompletion` - Tracks individual survey attempts
- `SurveyTransaction` - Transaction history for rewards

**Views Added to `core/views.py`:**
- `get_surveys()` - Fetch available surveys
- `start_survey()` - Generate survey URLs
- `user_dashboard()` - User balance and history
- `BitLabsCallbackView` - Handle S2S callbacks

**URLs Added to `core/urls.py`:**
- `/api/surveys/` - GET surveys
- `/api/surveys/start/` - POST to start survey
- `/api/dashboard/` - GET user dashboard
- `/api/bitlabs/callback/` - POST callback endpoint

**Service Created:**
- `core/services/bitlabs_service.py` - BitLabs API integration

### 📱 Frontend Changes (in your existing `src` structure):

**Components Created:**
- `src/components/SurveyCard.tsx` - Survey display card
- `src/components/SurveysScreen.tsx` - Full surveys screen
- `src/components/BitLabsExample.tsx` - Integration example

**Services:**
- Uses your existing `src/services/api.ts` directly
- `src/types/bitlabs.ts` - TypeScript type definitions

## ⚙️ Required Configuration

### 1. Django Settings
Add these settings to your Django settings file:

```python
# BitLabs Configuration (add to your settings.py)
BITLABS_API_TOKEN = 'your_api_token_here'
BITLABS_USER_ID = 'your_user_id_here'
BITLABS_SECRET = 'your_secret_key_here'
BITLABS_BASE_URL = 'https://api.bitlabs.ai'  # Optional, defaults to this
```

### 2. Environment Variables (if using .env)
```env
BITLABS_API_TOKEN=your_api_token_here
BITLABS_USER_ID=your_user_id_here
BITLABS_SECRET=your_secret_key_here
```

### 3. Database Migration
```bash
# Create migrations for new models
python manage.py makemigrations core

# Apply migrations
python manage.py migrate
```

### 4. Install Required Package
```bash
# Install requests if not already installed
pip install requests
```

## 🔑 BitLabs Setup

### 1. Get BitLabs Credentials
1. Sign up at [BitLabs Developer Portal](https://www.bitlabs.ai/)
2. Create an app and get:
   - API Token
   - User ID
   - Secret Key

### 2. Configure Callback URL
Set your callback URL in BitLabs dashboard:
```
https://your-domain.com/api/bitlabs/callback/
```
For development: `http://localhost:8000/api/bitlabs/callback/`

## 📱 React Native Usage

### Import and Use
```typescript
// In your App.tsx or any screen
import SurveysScreen from './src/components/SurveysScreen';

const YourApp = () => {
  return <SurveysScreen />;
};
```

### API Service Usage
```typescript
import { apiCall } from './src/services/api';

// Get surveys
const response = await apiCall('/api/surveys/');
const surveys = response.data;

// Start survey
const startResponse = await apiCall('/api/surveys/start/', {
  method: 'POST',
  data: { survey_id: 'survey-id' }
});

// Get user dashboard
const dashboardResponse = await apiCall('/api/dashboard/');
```

## 🔧 Features Included

✅ **Survey Management**
- Fetch available surveys
- Generate survey URLs with tracking
- Handle survey completion callbacks

✅ **User Management**
- Automatic user profile creation
- Balance and earnings tracking
- Transaction history

✅ **Security**
- HMAC signature verification for callbacks
- Uses your existing API patterns
- No authentication required initially (follows your existing pattern)

✅ **Admin Interface**
- Django admin for managing surveys and users
- Transaction tracking and monitoring

## 🚀 Testing

1. **Start Django server:**
   ```bash
   python manage.py runserver
   ```

2. **Test API endpoints:**
   - GET `/api/surveys/` - Should return available surveys
   - POST `/api/surveys/start/` - Should generate survey URL
   - GET `/api/dashboard/` - Should return user dashboard

3. **Test React Native:**
   ```bash
   npx react-native run-android
   ```

## 🛠️ Customization

The integration is modular and you can:
- Modify the UI components in `src/components/`
- Extend the API service in `src/services/bitlabs.ts`
- Add custom business logic in Django views
- Integrate with your existing user system

## 📊 Monitoring

Check Django admin at `/admin/` to monitor:
- User profiles and balances
- Survey completions
- Transaction history

---

The BitLabs integration is now seamlessly added to your existing project structure without disrupting any of your current functionality!
