import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStaticNavigation, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';

import HomeScreen from '../screens/home/HomeScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import ImagePreviewScreen from '../screens/camera/ImagePreviewScreen';
import DiagnosisResultScreen from '../screens/diagnosis/DiagnosisResultScreen';
import DiagnosisDetailScreen from '../screens/diagnosis/DiagnosisDetailScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const HomeTabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: '#2196F3',
    tabBarInactiveTintColor: '#999',
    tabBarStyle: {
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      paddingTop: 8,
      paddingBottom: 8,
      height: 60,
    },
  },
  screens: {
    HomeTab: {
      screen: HomeScreen,
      options: { tabBarLabel: 'Accueil' },
    },
    HistoryTab: {
      screen: HistoryScreen,
      options: { tabBarLabel: 'Historique' },
    },
    DashboardTab: {
      screen: DashboardScreen,
      options: { tabBarLabel: 'Dashboard' },
    },
    SettingsTab: {
      screen: SettingsScreen,
      options: { tabBarLabel: 'Parametres' },
    },
  },
});

const MainStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    MainTabs: {
      screen: HomeTabs,
    },
    Camera: {
      screen: CameraScreen,
    },
    ImagePreview: {
      screen: ImagePreviewScreen,
    },
    DiagnosisResult: {
      screen: DiagnosisResultScreen,
    },
    DiagnosisDetail: {
      screen: DiagnosisDetailScreen,
    },
  },
});

const AuthStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
    contentStyle: { backgroundColor: '#FFFFFF' },
  },
  screens: {
    Login: {
      screen: LoginScreen,
    },
    Register: {
      screen: RegisterScreen,
    },
    ForgotPassword: {
      screen: ForgotPasswordScreen,
    },
  },
});

const RootNavigator = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Auth: {
      screen: AuthStack,
      if: useIsNotAuthenticated,
    },
    Main: {
      screen: MainStack,
      if: useIsAuthenticated,
    },
  },
});

function useIsAuthenticated() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated;
}

function useIsNotAuthenticated() {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated;
}

const Navigation = createStaticNavigation(RootNavigator);

export default function AppNavigator() {
  const { isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return <Navigation />;
}
