import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import TeacherLoginScreen from '../screens/TeacherLoginScreen';
import TeacherRegisterScreen from '../screens/TeacherRegisterScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MarkAttendanceScreen from '../screens/MarkAttendanceScreen';

export type RootStackParamList = {
  Home: undefined;
  TeacherLogin: undefined;
  TeacherRegister: undefined;
  Register: undefined;
  MarkAttendance: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f1720',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#fff',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Attendance System',
          }}
        />
        <Stack.Screen
          name="TeacherLogin"
          component={TeacherLoginScreen}
          options={{
            title: 'Teacher Login',
          }}
        />
        <Stack.Screen
          name="TeacherRegister"
          component={TeacherRegisterScreen}
          options={{
            title: 'Teacher Registration',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Register Student',
          }}
        />
        <Stack.Screen
          name="MarkAttendance"
          component={MarkAttendanceScreen}
          options={{
            title: 'Mark Attendance',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
