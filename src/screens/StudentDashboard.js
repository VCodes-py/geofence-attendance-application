import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Button, Card, Title, Paragraph, ActivityIndicator, Text, Snackbar } from 'react-native-paper';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { calculateDistance } from '../utils/haversine';
import SessionTimer from '../components/SessionTimer';

const StudentDashboard = () => {
    const { userToken, logout } = useContext(AuthContext);
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarColor, setSnackbarColor] = useState('#333');

    const showSnackbar = (msg, type = 'error') => {
        setSnackbarMessage(msg);
        setSnackbarColor(type === 'success' ? '#059669' : '#E11D48');
        setSnackbarVisible(true);
    };

    const [activeClasses, setActiveClasses] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState([]);

    const fetchAttendanceSummary = async () => {
        try {
            const response = await client.get('/analytics/student/summary');
            setAttendanceSummary(response.data.data || []);
        } catch (error) {
            console.log('Error fetching attendance summary:', error);
        }
    };

    const fetchActiveClasses = async () => {
        try {
            const response = await client.get('/classes/active');
            setActiveClasses(response.data.data || []);
        } catch (error) {
            console.log('Error fetching active classes:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
            await fetchActiveClasses();
            await fetchAttendanceSummary();
        } catch (error) {
            console.log('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            await fetchActiveClasses();
            await fetchAttendanceSummary();
        })();
    }, []);

    const getAveragedLocation = async () => {
        let bestAccuracy = 999;
        let latSum = 0;
        let lngSum = 0;
        let validReadings = 0;
        let isMocked = false;

        showSnackbar('Acquiring high-precision GPS lock... Please hold still.', 'success');

        for (let i = 0; i < 3; i++) {
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
                if (loc.coords.accuracy < bestAccuracy) {
                    bestAccuracy = loc.coords.accuracy;
                }
                latSum += loc.coords.latitude;
                lngSum += loc.coords.longitude;
                if (loc.mocked) isMocked = true;
                validReadings++;
                
                // Delay between readings for spread
                await new Promise(resolve => setTimeout(resolve, 800));
            } catch (e) {
                console.log("Error reading location chunk", e);
            }
        }

        if (validReadings === 0) {
            throw new Error('Could not acquire GPS signal. Check your permissions.');
        }

        // The Accuracy Filter cutoff (15 meters)
        if (bestAccuracy > 15) {
            throw new Error(`GPS signal too weak (Accuracy: ${bestAccuracy.toFixed(1)}m). Step near a window or enable Wi-Fi and try again.`);
        }

        return {
            coords: {
                latitude: latSum / validReadings,
                longitude: lngSum / validReadings,
                accuracy: bestAccuracy,
            },
            mocked: isMocked
        };
    };

    const markAttendance = async (session) => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            showSnackbar('Location permission required to mark attendance.', 'error');
            setLoading(false);
            return;
        }

        try {
            // Get High-Precision Averaged Location
            const loc = await getAveragedLocation();
            setLocation(loc); // Keep UI in sync

            let currentDeviceId = 'WEB_DEVICE_ID';
            if (Platform.OS === 'android') {
                currentDeviceId = Application.getAndroidId();
            } else if (Platform.OS === 'ios') {
                currentDeviceId = await Application.getIosIdForVendorAsync();
            }

            // Prepare Payload
            const payload = {
                sessionId: session._id,
                location: {
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude,
                    accuracy: loc.coords.accuracy || 10,
                    isMocked: loc.mocked || false
                },
                deviceInfo: {
                    deviceId: currentDeviceId || 'UNKNOWN_DEVICE',
                    integrityToken: 'valid-token-simulation', // Simulating
                    isDevMode: false, // Expo Go doesn't expose this easily without EAS Build
                    isRooted: false
                }
            };

            const response = await client.post('/attendance/mark', payload);
            showSnackbar('Yes! Attendance marked successfully.', 'success');
            // Refresh data immediately
            fetchActiveClasses();
            fetchAttendanceSummary();
        } catch (error) {
            const errorMessage = (error.message && !error.response) ? error.message : (error.response?.data?.message || 'Cannot mark attendance. Please try again.');
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Title style={styles.headerTitle}>Student Dashboard</Title>
                        <Text style={styles.headerSubtitle}>Mark your attendance</Text>
                    </View>
                    <Button mode="text" onPress={logout} labelStyle={{ color: '#E11D48', fontWeight: 'bold' }}>Logout</Button>
                </View>

                <Card style={[styles.card, styles.locationBox]}>
                    <Card.Content>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>GPS Status</Text>
                            {location ? (
                                <Text style={[styles.statusBadge, { backgroundColor: '#D1FAE5', color: '#059669' }]}>
                                    Active • {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                                </Text>
                            ) : (
                                <Text style={[styles.statusBadge, { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
                                    Fetching...
                                </Text>
                            )}
                        </View>
                    </Card.Content>
                </Card>

                <Title style={styles.sectionTitle}>My Attendance</Title>
                
                {attendanceSummary.length === 0 ? (
                    <Text style={styles.emptyText}>No attendance records found yet.</Text>
                ) : (
                    <View style={styles.summaryContainer}>
                        {attendanceSummary.map((sub, idx) => (
                            <View key={idx} style={styles.summaryBox}>
                                <Text style={styles.summarySubject}>{sub.subjectName}</Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min(sub.percentage, 100)}%`, backgroundColor: sub.percentage >= 75 ? '#10B981' : sub.percentage >= 50 ? '#F59E0B' : '#EF4444' }]} />
                                </View>
                                <Text style={styles.summaryPercentage}>{sub.percentage}% ({sub.attendedSessions}/{sub.totalSessions})</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Title style={[styles.sectionTitle, { marginTop: 20 }]}>Active Classes</Title>

                {activeClasses.length === 0 ? (
                    <Text style={styles.emptyText}>There are no active classes going on right now.</Text>
                ) : (
                    activeClasses.map((session, index) => (
                        <Card key={index} style={styles.card}>
                            <Card.Content>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Title style={styles.cardTitle}>{session.subject.name}</Title>
                                    <SessionTimer endTime={session.endTime} onExpire={() => fetchActiveClasses()} />
                                </View>

                                <View style={styles.row}>
                                    <Text style={styles.detailLabel}>Faculty:</Text>
                                    <Text style={styles.detailValue}>{session.faculty.firstName} {session.faculty.lastName}</Text>
                                </View>

                                <View style={styles.row}>
                                    <Text style={styles.detailLabel}>Geofence Radius:</Text>
                                    <Text style={styles.detailValue}>{session.radiusMeters} meters</Text>
                                </View>
                            </Card.Content>
                            <Card.Actions style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                <Button
                                    mode="contained"
                                    onPress={() => markAttendance(session)}
                                    loading={loading === true}
                                    disabled={loading === true || location === null}
                                    style={styles.primaryBtn}
                                    labelStyle={{ fontWeight: 'bold', fontSize: 16, paddingVertical: 4 }}
                                    contentStyle={{ width: '100%' }}
                                >
                                    Mark Attendance
                                </Button>
                            </Card.Actions>
                        </Card>
                    ))
                )}
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3500}
                style={{ backgroundColor: snackbarColor }}
                action={{
                    label: 'OK',
                    labelStyle: { color: '#FFF' },
                    onPress: () => setSnackbarVisible(false),
                }}
            >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{snackbarMessage}</Text>
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
        paddingHorizontal: 8
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        letterSpacing: 0.5
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: -4
    },
    locationBox: {
        marginBottom: 24,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#E0F2FE'
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0369A1'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        fontWeight: 'bold',
        fontSize: 14
    },
    sectionTitle: {
        marginBottom: 16,
        fontSize: 22,
        fontWeight: '700',
        color: '#334155',
        paddingHorizontal: 8
    },
    card: {
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 12
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    detailLabel: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500'
    },
    detailValue: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '600'
    },
    primaryBtn: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
        elevation: 2
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        fontStyle: 'italic',
        color: '#94A3B8'
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 4
    },
    summaryBox: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    summarySubject: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 8,
        height: 40 // Fixed height for 2-line wrapping
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3
    },
    summaryPercentage: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'right'
    }
});

export default StudentDashboard;
