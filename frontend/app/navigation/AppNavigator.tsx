import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@theme/ThemeContext';

import LoginScreen from '@screens/LoginScreen';
import SignupScreen from '@screens/SignupScreen';
import PatientHomeScreen from '@screens/PatientHomeScreen';
import DoctorHomeScreen from '@screens/DoctorHomeScreen';
import PatientDetailScreen from '@screens/PatientDetailScreen';
import ProfileScreen from '@screens/ProfileScreen';
import LogbookScreen from '@screens/LogbookScreen';
import ExerciseDetailScreen from '@screens/ExerciseDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PatientTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGray,
        tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            elevation: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Summary" 
        component={PatientHomeScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const DoctorTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGray,
        tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            elevation: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Patients" 
        component={DoctorHomeScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
    const { colors } = useTheme();
    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Group>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="DoctorHome" component={DoctorTabNavigator} />
                    <Stack.Screen name="PatientHome" component={PatientTabNavigator} />
                    <Stack.Screen 
                        name="PatientDetail" 
                        component={PatientDetailScreen} 
                        options={{ 
                            headerShown: true,
                            headerTitle: 'Recovery Plan',
                            headerBackTitle: 'Back',
                            headerStyle: {
                                backgroundColor: colors.background,
                                shadowColor: 'transparent',
                            },
                            headerTintColor: colors.primary,
                            headerTitleStyle: {
                                color: colors.text,
                            }
                        }} 
                    />
                     <Stack.Screen 
                        name="Logbook" 
                        component={LogbookScreen} 
                        options={{ 
                            headerShown: true,
                            headerTitle: 'Logbook',
                            headerBackTitle: 'Back',
                            headerStyle: {
                                backgroundColor: colors.background,
                                shadowColor: 'transparent',
                            },
                            headerTintColor: colors.primary,
                            headerTitleStyle: {
                                color: colors.text,
                            }
                        }} 
                    />
                </Stack.Group>
                <Stack.Group screenOptions={{ presentation: 'modal' }}>
                    <Stack.Screen 
                        name="ExerciseDetail" 
                        component={ExerciseDetailScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Group>
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator; 