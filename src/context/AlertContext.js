import React, { createContext, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info' // info, success, error, confirm
    });

    const hideAlert = () => setVisible(false);

    const showAlert = useCallback((title, message, buttons = null, type = 'info') => {
        setAlertConfig({
            title,
            message,
            buttons: buttons || [{ text: 'OK', onPress: () => {} }],
            type
        });
        setVisible(true);
    }, []);

    const getIcon = () => {
        switch (alertConfig.type) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'confirm': return 'help-circle';
            default: return 'information';
        }
    };

    const getIconColor = () => {
        switch (alertConfig.type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            case 'confirm': return '#0EA5E9';
            default: return '#3B82F6';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Portal>
                <Dialog 
                    visible={visible} 
                    onDismiss={hideAlert} 
                    style={styles.dialog}
                    theme={{
                        colors: {
                            surface: '#FFFFFF',
                            surfaceVariant: '#FFFFFF',
                            elevation: {
                                level0: 'transparent',
                                level1: '#FFFFFF',
                                level2: '#FFFFFF',
                                level3: '#FFFFFF',
                                level4: '#FFFFFF',
                                level5: '#FFFFFF',
                            },
                            backdrop: 'rgba(15, 23, 42, 0.45)',
                        }
                    }}
                >
                    <Dialog.Title style={styles.titleContainer}>
                        <MaterialCommunityIcons name={getIcon()} size={28} color={getIconColor()} style={{ marginRight: 8 }} />
                        <Text style={styles.titleText}>{alertConfig.title}</Text>
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.messageText}>{alertConfig.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.actions}>
                        {alertConfig.buttons.map((btn, index) => (
                            <Button 
                                key={index} 
                                mode={btn.style === 'cancel' || btn.style === 'destructive' ? 'outlined' : 'contained'}
                                textColor={btn.style === 'cancel' ? '#64748B' : btn.style === 'destructive' ? '#EF4444' : '#FFFFFF'}
                                buttonColor={btn.style === 'cancel' || btn.style === 'destructive' ? 'transparent' : '#0EA5E9'}
                                style={[styles.button, btn.style === 'destructive' && { borderColor: '#EF4444' }]}
                                onPress={() => {
                                    hideAlert();
                                    if (btn.onPress) btn.onPress();
                                }}
                            >
                                {btn.text}
                            </Button>
                        ))}
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    dialog: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 24,
        zIndex: 9999,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        flex: 1,
    },
    messageText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 24,
    },
    actions: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        justifyContent: 'flex-end',
        gap: 8,
    },
    button: {
        borderRadius: 8,
        minWidth: 80,
    }
});
