import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { StatusBar, Platform } from 'react-native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import StudentDashboard from './src/screens/StudentDashboard';
import FacultyDashboard from './src/screens/FacultyDashboard';
import FacultyAnalytics from './src/screens/FacultyAnalytics';
import AdminDashboard from './src/screens/AdminDashboard';
import ForceResetScreen from './src/screens/ForceResetScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack for Unauthenticated Users
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Tabs for Student (Can be expanded for other roles)
const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        return <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0EA5E9',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Dashboard" component={StudentDashboard} />
    {/* Add Profile or History screens here */}
  </Tab.Navigator>
);

// Tabs for Faculty
const FacultyTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName = route.name === 'Home' ? 'home' : 'chart-bar';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0EA5E9',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={FacultyDashboard} />
    <Tab.Screen name="Analytics" component={FacultyAnalytics} />
  </Tab.Navigator>
);

// Tabs for Admin
const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
  </Stack.Navigator>
);

// Stack for Force Password Reset
const ForceResetStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ForceReset" component={ForceResetScreen} />
  </Stack.Navigator>
);

// Main Navigation Controller
const AppNav = () => {
  const { userToken, userRole, userInfo, isLoading } = useContext(AuthContext);

  if (isLoading) {
    // We could return a SplashScreen here
    return null;
  }

  const mustReset = userInfo && userInfo.mustChangePassword;

  return (
    <NavigationContainer>
      {userToken ? (
        mustReset ? <ForceResetStack /> :
        // Role Based Navigation
        userRole === 'STUDENT' ? <StudentTabs /> :
          userRole === 'FACULTY' ? <FacultyTabs /> : // Faculty Dashboard Screen
            (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') ? <AdminStack /> :
              <StudentTabs /> // Default fallback
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    // Configure foreground notifications handling
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification Response] Clicked notification data:', data);
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <AlertProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <AppNav />
        </AlertProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
