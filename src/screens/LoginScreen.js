import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);
    const [error, setError] = useState('');

    const getDeviceFingerprint = async () => {
        let deviceId = 'WEB_DEVICE_ID';
        if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId();
        } else if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync();
        }

        return {
            deviceId: deviceId || 'UNKNOWN_DEVICE',
            deviceModel: Device.modelName || 'Unknown Model',
            osVersion: Device.osVersion || 'Unknown OS'
        };
    };

    const handleLogin = async () => {
        setError('');
        const fingerprint = await getDeviceFingerprint();
        const result = await login(email, password, fingerprint);
        if (!result.success) {
            setError(result.error || result.message || 'Login failed.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Title style={styles.title}>Geofence</Title>
                    <Title style={styles.subtitle}>Attendance</Title>
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        mode="outlined"
                        outlineColor="#CBD5E1"
                        activeOutlineColor="#0EA5E9"
                        textColor="#0F172A"
                    />

                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        style={styles.input}
                        mode="outlined"
                        outlineColor="#CBD5E1"
                        activeOutlineColor="#0EA5E9"
                        textColor="#0F172A"
                    />

                    {error ? <HelperText type="error" visible={error.length > 0} style={styles.errorText}>{error}</HelperText> : null}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading === true}
                        disabled={isLoading === true}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                    >
                        Secure Login
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 24,
    },
    headerContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#0EA5E9',
        lineHeight: 48,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1E293B',
        lineHeight: 38,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FCFCFD',
    },
    button: {
        marginTop: 12,
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E11D48',
        marginBottom: 8,
    }
});

export default LoginScreen;
