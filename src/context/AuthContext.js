import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- Platform Safe Storage Wrapper ---
    const setItemAsync = async (key, value) => {
        if (Platform.OS === 'web') {
            try { localStorage.setItem(key, value); } catch (e) { console.error('Local storage unavailable', e); }
        } else {
            return SecureStore.setItemAsync(key, value);
        }
    };

    const getItemAsync = async (key) => {
        if (Platform.OS === 'web') {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        } else {
            return SecureStore.getItemAsync(key);
        }
    };

    const deleteItemAsync = async (key) => {
        if (Platform.OS === 'web') {
            try { localStorage.removeItem(key); } catch (e) { }
        } else {
            return SecureStore.deleteItemAsync(key);
        }
    };
    // ------------------------------------

    const registerForPushNotificationsAsync = async () => {
        if (Platform.OS === 'web') return null;

        let token = null;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notifications!');
                return null;
            }
            try {
                const tokenData = await Notifications.getExpoPushTokenAsync();
                token = tokenData.data;
                console.log('[Push] Registration Token:', token);
            } catch (e) {
                console.error('[Push] Error fetching Expo push token:', e);
            }
        } else {
            console.log('[Push] Notification requires a physical device');
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    };

    const login = async (email, password, fingerprint) => {
        setIsLoading(true);
        console.log(`[Auth] Attempting login for ${email} on device ${fingerprint?.deviceId}`);
        try {
            const pushToken = await registerForPushNotificationsAsync();

            const response = await client.post('/auth/login', {
                email,
                password,
                pushToken,
                ...fingerprint,
                deviceInfo: {
                    deviceId: fingerprint?.deviceId || 'UNKNOWN',
                    integrityToken: 'web-token-simulation',
                    isDevMode: false,
                    isRooted: false
                }
            });
            console.log(`[Auth] Login Response Status: ${response.status}`);

            const { accessToken, refreshToken, role, ...userData } = response.data.data;

            setUserToken(accessToken);
            setUserRole(role);
            setUserInfo(userData);

            await setItemAsync('accessToken', accessToken);
            await setItemAsync('refreshToken', refreshToken);
            await setItemAsync('userRole', role);
            await setItemAsync('userInfo', JSON.stringify(userData));

            setIsLoading(false);
            console.log(`[Auth] Login successful. Role: ${role}`);
            return { success: true };
        } catch (e) {
            setIsLoading(false);
            console.log(`[Auth] Login failed error: ${e.response?.data?.message || e.message}`);
            return { success: false, error: e.response?.data?.message || 'Login failed' };
        }
    };

    const passwordResetComplete = async () => {
        const updatedUserInfo = { ...userInfo, mustChangePassword: false };
        setUserInfo(updatedUserInfo);
        await setItemAsync('userInfo', JSON.stringify(updatedUserInfo));
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserRole(null);
        setUserInfo(null);
        await deleteItemAsync('accessToken');
        await deleteItemAsync('refreshToken');
        await deleteItemAsync('userRole');
        await deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await getItemAsync('accessToken');
            let userRole = await getItemAsync('userRole');
            let userInfo = await getItemAsync('userInfo');

            if (userToken) {
                setUserToken(userToken);
                setUserRole(userRole);
                setUserInfo(userInfo ? JSON.parse(userInfo) : null);
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userRole, userInfo, passwordResetComplete }}>
            {children}
        </AuthContext.Provider>
    );
};
