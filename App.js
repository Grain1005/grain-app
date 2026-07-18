import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
import { hasCompletedOnboarding } from './storage';
import { trackAppOpened, trackTabViewed } from './analytics';
import HomeScreen from './HomeScreen';
import PillarsScreen from './PillarsScreen';
import DashboardScreen from './DashboardScreen';
import SettingsScreen from './Settingsscreen';
import OnboardingScreen from './OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.log('Grain crash caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#E64833', marginBottom: 12 }}>
            Grain crashed
          </Text>
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 16 }}>
            Screenshot this and send to the developer:
          </Text>
          <ScrollView style={{ backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, maxHeight: 400 }}>
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
              {this.state.error ? this.state.error.toString() : 'Unknown error'}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: '#9B9891',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#EEEDE6',
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: bottomPadding + 8,
          height: 60 + bottomPadding,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Pillars') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
      screenListeners={{
        tabPress: (e) => {
          const tabName = e.target?.split('-')[0];
          trackTabViewed(tabName);
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pillars" component={PillarsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const complete = await hasCompletedOnboarding();
        setOnboardingComplete(complete);
        trackAppOpened();
      } catch (e) {
        console.log('App init error:', e);
        setInitError(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#E64833', marginBottom: 12 }}>
            Grain startup error
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
            {initError.toString()}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!onboardingComplete) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}