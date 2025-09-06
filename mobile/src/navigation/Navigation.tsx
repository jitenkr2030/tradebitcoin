import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import DashboardScreen from '../screens/DashboardScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import TradingScreen from '../screens/TradingScreen';
import AIAdvisorScreen from '../screens/AIAdvisorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TaxAssistantScreen from '../screens/TaxAssistantScreen';
import DeFiScreen from '../screens/DeFiScreen';
import EducationScreen from '../screens/EducationScreen';
import BacktestingScreen from '../screens/BacktestingScreen';
import CopyTradingScreen from '../screens/CopyTradingScreen';
import AdvancedOrdersScreen from '../screens/AdvancedOrdersScreen';
import RiskManagementScreen from '../screens/RiskManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Trading':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Portfolio':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'AI Advisor':
              iconName = focused ? 'brain' : 'brain-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trading" component={TradingScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="AI Advisor" component={AIAdvisorScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="TaxAssistant" 
              component={TaxAssistantScreen}
              options={{
                headerShown: true,
                title: 'Tax Assistant',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="DeFi" 
              component={DeFiScreen}
              options={{
                headerShown: true,
                title: 'DeFi Dashboard',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="Education" 
              component={EducationScreen}
              options={{
                headerShown: true,
                title: 'Education Center',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="Backtesting" 
              component={BacktestingScreen}
              options={{
                headerShown: true,
                title: 'Backtesting',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="CopyTrading" 
              component={CopyTradingScreen}
              options={{
                headerShown: true,
                title: 'Copy Trading',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="AdvancedOrders" 
              component={AdvancedOrdersScreen}
              options={{
                headerShown: true,
                title: 'Advanced Orders',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen 
              name="RiskManagement" 
              component={RiskManagementScreen}
              options={{
                headerShown: true,
                title: 'Risk Management',
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFFFFF',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}