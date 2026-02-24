import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

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
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text.tertiary,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      paddingBottom: 8,
      height: 60,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
  },
  screens: {
    HomeTab: {
      screen: HomeScreen,
      options: {
        tabBarLabel: 'Accueil',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Feather name="home" size={size} color={color} />
        ),
      },
    },
    HistoryTab: {
      screen: HistoryScreen,
      options: {
        tabBarLabel: 'Historique',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Feather name="clock" size={size} color={color} />
        ),
      },
    },
    DashboardTab: {
      screen: DashboardScreen,
      options: {
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Feather name="bar-chart-2" size={size} color={color} />
        ),
      },
    },
    SettingsTab: {
      screen: SettingsScreen,
      options: {
        tabBarLabel: 'Parametres',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Feather name="settings" size={size} color={color} />
        ),
      },
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
    contentStyle: { backgroundColor: colors.background },
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Navigation />;
}
