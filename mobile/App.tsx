import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import FoodListsScreen from './src/screens/FoodListsScreen';
import AddInfoScreen from './src/screens/AddInfoScreen';
import DecideScreen from './src/screens/DecideScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FoodLists" component={FoodListsScreen} />
        <Stack.Screen name="AddInfo" component={AddInfoScreen} />
        <Stack.Screen name="Decide" component={DecideScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
