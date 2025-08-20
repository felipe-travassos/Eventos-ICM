import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SubscriptionScreen } from '../screens/tabs/SubscriptionScreen';
import { CompletedScreen } from '../screens/tabs/CompletedScreen';
import { AboutScreen } from '../screens/tabs/AboutScreen';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

export type TabParamList = {
  Subscription: undefined;
  Completed: undefined;
  About: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          tabBarLabel: 'Inscrição',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Completed"
        component={CompletedScreen}
        options={{
          tabBarLabel: 'Realizados',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          tabBarLabel: 'Sobre',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="info" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};