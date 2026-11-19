import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SessionTimer = ({ endTime, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        if (!endTime) return;

        const calculateTimeLeft = () => {
            const end = new Date(endTime).getTime();
            const now = new Date().getTime();
            const difference = end - now;

            if (difference <= 0) {
                setTimeLeft('00:00');
                setIsExpired(true);
                if (!hasExpiredRef.current) {
                    hasExpiredRef.current = true;
                    if (onExpire) onExpire();
                }
                return true; // Expired
            }

            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Format with leading zeros
            const m = minutes < 10 ? `0${minutes}` : minutes;
            const s = seconds < 10 ? `0${seconds}` : seconds;

            setTimeLeft(`${m}:${s}`);
            return false; // Not expired
        };

        // Initial call
        const expired = calculateTimeLeft();

        // Start interval only if not expired
        let timer;
        if (!expired) {
            timer = setInterval(() => {
                const isNowExpired = calculateTimeLeft();
                if (isNowExpired) {
                    clearInterval(timer);
                }
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [endTime, onExpire]);

    if (!endTime) return null;

    return (
        <View style={[styles.container, isExpired ? styles.expiredContainer : styles.activeContainer]}>
            <MaterialCommunityIcons 
                name="clock-outline" 
                size={18} 
                color={isExpired ? '#EF4444' : '#0EA5E9'} 
                style={styles.icon} 
            />
            <Text style={[styles.timeText, isExpired ? styles.expiredText : styles.activeText]}>
                {isExpired ? 'Session Ended' : `${timeLeft} remaining`}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    activeContainer: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    expiredContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    icon: {
        marginRight: 6,
    },
    timeText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeText: {
        color: '#0284C7',
    },
    expiredText: {
        color: '#DC2626',
    }
});

export default SessionTimer;
