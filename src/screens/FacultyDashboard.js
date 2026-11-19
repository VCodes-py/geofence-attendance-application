import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, TextInput, Menu, Portal, Dialog, DataTable } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import CustomDropdown from '../components/CustomDropdown';
import SessionTimer from '../components/SessionTimer';
import client from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const FacultyDashboard = () => {
    const { logout } = useContext(AuthContext);
    const { showAlert } = useContext(AlertContext);
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [duration, setDuration] = useState('60');
    const [activeSession, setActiveSession] = useState(null);
    const [studentId, setStudentId] = useState('');
    const [startLoading, setStartLoading] = useState(false);
    const [stopLoading, setStopLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [manualLoading, setManualLoading] = useState(false);

    // State variables for menus removed as CustomDropdown handles its own state internally.

    // Live Stats Modal
    const [statsModalVisible, setStatsModalVisible] = useState(false);
    const [sessionStatsData, setSessionStatsData] = useState([]);

    // Edit Session Modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editRadius, setEditRadius] = useState('');
    const [editAddTime, setEditAddTime] = useState('0');

    useEffect(() => {
        fetchVenues();
        fetchSubjects();
        fetchCurrentSession();
    }, []);

    const fetchCurrentSession = async () => {
        try {
            const res = await client.get('/classes/my-sessions');
            const sessions = res.data.data || [];
            if (sessions.length > 0 && sessions[0].status === 'ACTIVE') {
                setActiveSession(sessions[0]);
            } else {
                setActiveSession(null);
            }
        } catch (e) {
            console.log('Failed to fetch existing sessions', e);
        }
    };

    const fetchVenues = async () => {
        try {
            const res = await client.get('/classes/venues');
            setVenues(res.data.data);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await client.get('/classes/subjects');
            setSubjects(res.data.data);
        } catch (e) {
            console.log(e);
        }
    };

    const startSession = async () => {
        if (!selectedVenue) return showAlert('Error', 'Select a Venue', null, 'error');
        if (!selectedSubject) return showAlert('Error', 'Select a Subject', null, 'error');
        setStartLoading(true);
        try {
            const res = await client.post('/classes', {
                subjectId: selectedSubject._id,
                venueId: selectedVenue._id,
                durationMinutes: parseInt(duration)
            });
            setActiveSession(res.data.data);
            showAlert('Success', 'Session Started', null, 'success');
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Failed', null, 'error');
        }
        setStartLoading(false);
    };

    const stopSession = async () => {
        if (!activeSession) return;
        setStopLoading(true);
        try {
            await client.put(`/classes/${activeSession._id}/stop`);
            setActiveSession(null);
            showAlert('Success', 'Session Stopped', null, 'success');
        } catch (e) {
            showAlert('Error', 'Failed to stop', null, 'error');
        }
        setStopLoading(false);
    };

    const handleEditSession = () => {
        showAlert(
            "Confirm Update",
            "Are you sure you want to change these active session parameters?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save Changes", onPress: async () => {
                        setEditLoading(true);
                        try {
                            const payload = {};
                            if (editRadius && editRadius !== activeSession.radiusMeters?.toString()) {
                                payload.radiusMeters = parseInt(editRadius);
                            }
                            if (editAddTime && editAddTime !== '0') {
                                payload.addMinutes = parseInt(editAddTime);
                            }
                            
                            if (Object.keys(payload).length === 0) {
                                setEditModalVisible(false);
                                setEditLoading(false);
                                return;
                            }

                            const res = await client.put(`/classes/${activeSession._id}`, payload);
                            setActiveSession(res.data.data);
                            setEditModalVisible(false);
                            showAlert('Success', 'Session updated successfully', null, 'success');
                        } catch (e) {
                            showAlert('Error', e.response?.data?.message || 'Failed to update session', null, 'error');
                        }
                        setEditLoading(false);
                    }
                }
            ],
            'confirm'
        );
    };

    const openEditModal = () => {
        setEditRadius(activeSession.radiusMeters ? activeSession.radiusMeters.toString() : '');
        setEditAddTime('0');
        setEditModalVisible(true);
    };

    const fetchStats = async (sessionId) => {
        try {
            const res = await client.get(`/analytics/session/${sessionId}/details`);
            setSessionStatsData(res.data.data || []);
            setStatsModalVisible(true);
        } catch (e) {
            showAlert('Error', 'Failed to fetch live stats', null, 'error');
        }
    };

    const exportCSV = async (sessionId) => {
        try {
            const res = await client.get(`/analytics/session/${sessionId}/export`);
            const filename = `session-${sessionId}-export.csv`;

            if (Platform.OS === 'web') {
                // Trigger actual download in web browsers
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showAlert('Success', 'CSV Exported Successfully.', null, 'success');
            } else {
                // Native iOS/Android Export
                const fileUri = FileSystem.documentDirectory + filename;
                await FileSystem.writeAsStringAsync(fileUri, res.data, { encoding: FileSystem.EncodingType.UTF8 });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    showAlert('Saved', 'File saved to App Document Directory', null, 'success');
                }
            }
        } catch (e) {
            console.error('Export Error:', e);
            const errorMsg = e.response?.data?.message || 'Failed to export CSV.';
            showAlert('Export Failed', errorMsg, null, 'error');
        }
    };

    const manualAttendance = async () => {
        if (!activeSession) return showAlert('Error', 'No Active Session', null, 'error');
        if (!studentId) return showAlert('Error', 'Enter Student Roll No', null, 'error');

        setManualLoading(true);
        try {
            await client.post('/classes/manual-attendance', {
                sessionId: activeSession._id,
                studentRollNo: studentId
            });
            showAlert('Success', 'Attendance Marked Manually', null, 'success');
            setStudentId('');
        } catch (e) {
            showAlert('Error', e.response?.data?.message || 'Failed', null, 'error');
        } finally {
            setManualLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Title style={styles.headerTitle}>Faculty Dashboard</Title>
                    <Text style={styles.headerSubtitle}>Manage your classes</Text>
                </View>
                <Button mode="text" onPress={logout} labelStyle={{ color: '#E11D48', fontWeight: 'bold' }}>Logout</Button>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>Class Management</Title>

                        <CustomDropdown
                            label="Select Subject"
                            placeholder="Choose Subject"
                            options={subjects}
                            selectedValue={selectedSubject}
                            onSelect={setSelectedSubject}
                            labelField="name"
                            valueField="_id"
                        />

                        <CustomDropdown
                            label="Select Venue"
                            placeholder="Choose Venue"
                            options={venues}
                            selectedValue={selectedVenue}
                            onSelect={setSelectedVenue}
                            labelField="name"
                            valueField="_id"
                        />

                        <TextInput
                            label="Duration (Minutes)"
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            style={styles.input}
                            mode="outlined"
                            outlineColor="#CBD5E1"
                            activeOutlineColor="#0EA5E9"
                        />

                        {!activeSession ? (
                            <Button
                                mode="contained"
                                onPress={startSession}
                                loading={startLoading}
                                disabled={startLoading}
                                style={styles.startBtn}
                                labelStyle={{ fontWeight: 'bold', fontSize: 16, paddingVertical: 4 }}
                            >
                                Start Class
                            </Button>
                        ) : (
                            <View style={styles.activeSessionContainer}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={styles.activeStatusText}>• Session Active</Text>
                                    <SessionTimer endTime={activeSession.endTime} onExpire={() => fetchCurrentSession()} />
                                </View>
                                <Button
                                    mode="contained"
                                    onPress={stopSession}
                                    loading={stopLoading}
                                    disabled={stopLoading}
                                    style={styles.stopBtn}
                                    labelStyle={{ fontWeight: 'bold', fontSize: 16, color: '#FFFFFF', paddingVertical: 4 }}
                                >
                                    Stop Class
                                </Button>

                                <View style={[styles.actionRow, { marginBottom: 8 }]}>
                                    <Button mode="outlined" textColor="#0EA5E9" onPress={() => fetchStats(activeSession._id)} style={styles.actionBtn}>View Stats</Button>
                                    <Button mode="outlined" textColor="#0EA5E9" onPress={() => exportCSV(activeSession._id)} style={styles.actionBtn}>Export CSV</Button>
                                </View>
                                <Button mode="contained-tonal" icon="pencil" onPress={openEditModal} style={{ borderRadius: 8 }}>
                                    Edit Parameters
                                </Button>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {activeSession && (
                    <Card style={[styles.card, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE', borderWidth: 1 }]}>
                        <Card.Content>
                            <Title style={[styles.cardTitle, { color: '#0369A1' }]}>Manual Attendance</Title>
                            <Text style={{ color: '#475569', marginBottom: 12 }}>Force mark a student present (bypasses geofence)</Text>
                            <TextInput
                                label="Student Roll No / ID"
                                value={studentId}
                                onChangeText={setStudentId}
                                style={[styles.input, { backgroundColor: '#FFFFFF' }]}
                                mode="outlined"
                                outlineColor="#BAE6FD"
                                activeOutlineColor="#0284C7"
                            />
                            <Button
                                mode="contained"
                                onPress={manualAttendance}
                                loading={manualLoading}
                                disabled={manualLoading}
                                style={{ backgroundColor: '#0284C7', borderRadius: 8, marginTop: 8 }}
                                labelStyle={{ fontWeight: 'bold' }}
                            >
                                Mark Present
                            </Button>
                        </Card.Content>
                    </Card>
                )}

            <Portal>
                <Dialog visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} style={{ backgroundColor: '#FFF' }}>
                    <Dialog.Title style={{ color: '#0F172A', fontWeight: 'bold' }}>Edit Active Session</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="New Radius (Meters)"
                            value={editRadius}
                            onChangeText={setEditRadius}
                            keyboardType="numeric"
                            style={styles.input}
                            mode="outlined"
                        />
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12, marginTop: -12 }}>
                            Current radius: {activeSession?.radiusMeters}m
                        </Text>

                        <TextInput
                            label="Add Time (Minutes)"
                            value={editAddTime}
                            onChangeText={setEditAddTime}
                            keyboardType="numeric"
                            style={styles.input}
                            mode="outlined"
                        />
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: -12 }}>
                            Use a negative number (e.g. -10) to reduce time.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setEditModalVisible(false)} textColor="#64748B">Cancel</Button>
                        <Button onPress={handleEditSession} mode="contained" loading={editLoading} disabled={editLoading} style={{ borderRadius: 8, backgroundColor: '#0EA5E9' }}>Save</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={statsModalVisible} onDismiss={() => setStatsModalVisible(false)} style={{ maxHeight: '80%', backgroundColor: '#FFF' }}>
                    <Dialog.Title style={{ color: '#0F172A', fontWeight: 'bold' }}>Live Attendance Feed</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
                        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title>Roll No</DataTable.Title>
                                    <DataTable.Title>Name</DataTable.Title>
                                    <DataTable.Title numeric>Time</DataTable.Title>
                                </DataTable.Header>

                                {sessionStatsData.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#64748B' }}>No students have marked present yet.</Text>
                                    </View>
                                ) : sessionStatsData.map((stu, index) => (
                                    <DataTable.Row key={index}>
                                        <DataTable.Cell>{stu.studentId}</DataTable.Cell>
                                        <DataTable.Cell>{stu.firstName} {stu.lastName}</DataTable.Cell>
                                        <DataTable.Cell numeric style={{ minWidth: 60 }}>
                                            {new Date(stu.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setStatsModalVisible(false)} textColor="#0EA5E9">Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    contentContainer: { padding: 16, paddingBottom: 40 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 14,
        backgroundColor: 'rgba(248, 249, 250, 0.98)',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 16
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
        marginTop: 8
    },
    pickerBtn: {
        marginBottom: 12,
        alignSelf: 'stretch',
        borderRadius: 8,
        borderColor: '#CBD5E1',
        borderWidth: 1.5,
        backgroundColor: '#FCFCFD'
    },
    input: {
        marginBottom: 20,
        marginTop: 4,
        backgroundColor: '#FCFCFD'
    },

    startBtn: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
        elevation: 2
    },

    activeSessionContainer: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#F1F5F9'
    },
    activeStatusText: {
        color: '#059669',
        fontWeight: 'bold',
        fontSize: 16,
    },
    stopBtn: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8
    },
    actionBtn: {
        flex: 1,
        borderRadius: 8,
        borderColor: '#94A3B8'
    }
});

export default FacultyDashboard;
