// src/components/BitLabsExample.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SurveysScreen from './SurveysScreen';

/**
 * Example component showing how to integrate BitLabs surveys
 * into your existing app structure
 */
const BitLabsExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <SurveysScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BitLabsExample;

/*
  Usage in your App.tsx or navigation:
  
  import BitLabsExample from './src/components/BitLabsExample';
  // or directly import SurveysScreen
  import SurveysScreen from './src/components/SurveysScreen';
  
  // Then use it in your component:
  const YourApp = () => {
    return <SurveysScreen />;
  };
  
  // The components use your existing api.ts service:
  import { apiCall } from './src/services/api';
  
  // API calls:
  // GET /api/surveys/ - Fetch surveys
  // POST /api/surveys/start/ - Start survey
  // GET /api/dashboard/ - User dashboard
*/
