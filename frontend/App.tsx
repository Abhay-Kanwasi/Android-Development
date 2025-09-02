/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NewAppScreen } from '@react-native/new-app-screen';
import VideoTaskScreen from './src/components/VideoTaskScreen';
import HomeScreen from './src/components/HomeScreen';

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  VideoTask: { taskId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
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
});

export default App;