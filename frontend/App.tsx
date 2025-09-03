import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import VideoTaskScreen from './src/components/VideoTaskScreen';
import HomeScreen from './src/components/HomeScreen';

// Use the test ID for the banner
const adUnitId = TestIds.BANNER;

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  VideoTask: { taskId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob SDK Initialized!');
      });
  }, []);
  
  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: isDarkMode ? '#000' : '#fff',
                },
                headerTintColor: isDarkMode ? '#fff' : '#000',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={AppContent}
                options={{ title: 'Home' }}
              />
              <Stack.Screen 
                name="VideoTask" 
                component={VideoTaskScreen}
                options={{ title: 'Video Task' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <View style={styles.adContainer}>
              <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              />
          </View>
      </View>
    </SafeAreaProvider>
  );
}

function AppContent() {

  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default App;