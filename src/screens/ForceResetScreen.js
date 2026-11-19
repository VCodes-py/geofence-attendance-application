import React, { useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../api/client';

const ForceResetScreen = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { passwordResetComplete, logout } = useContext(AuthContext);

    const handleReset = async () => {
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await client.post('/auth/reset-first-password', {
                newPassword: password
            });

            if (response.data.success) {
                // Inform context password update is complete
                await passwordResetComplete();
            } else {
                setError(response.data.message || 'Reset failed.');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Server error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Title style={styles.title}>Secure Reset</Title>
                    <Title style={styles.subtitle}>Update temporary password</Title>
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        label="New Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        style={styles.input}
                        mode="outlined"
                        outlineColor="#CBD5E1"
                        activeOutlineColor="#0EA5E9"
                        textColor="#0F172A"
                    />

                    <TextInput
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
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
                        onPress={handleReset}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                    >
                        Update Password
                    </Button>

                    <Button
                        mode="text"
                        onPress={logout}
                        disabled={loading}
                        style={styles.cancelButton}
                        labelStyle={styles.cancelLabel}
                    >
                        Back to Login
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
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0EA5E9',
        lineHeight: 42,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#475569',
        textAlign: 'center',
        marginTop: 6,
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
    cancelButton: {
        marginTop: 10,
    },
    cancelLabel: {
        color: '#64748B',
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E11D48',
        marginBottom: 8,
    }
});

export default ForceResetScreen;
