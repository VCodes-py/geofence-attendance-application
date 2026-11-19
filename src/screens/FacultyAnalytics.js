import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Text, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, Menu, DataTable } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomDropdown from '../components/CustomDropdown';
import { AlertContext } from '../context/AlertContext';
import client from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const FacultyAnalytics = () => {
    const { showAlert } = useContext(AlertContext);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [stats, setStats] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingSession, setExportingSession] = useState(false);
    const [exportingMonthly, setExportingMonthly] = useState(false);

    // Menu state removed, CustomDropdown handles it

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await client.get('/classes/my-sessions');
            setSessions(res.data.data);
            if (res.data.data.length > 0) {
                // Automatically select the most recent session
                loadSessionData(res.data.data[0]);
            }
        } catch (e) {
            console.log('Error fetching sessions:', e);
            showAlert('Error', 'Could not load your session history.', null, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSessionData = async (session) => {
        setSelectedSession(session);
        setLoading(true);
        try {
            // Fetch High-Level Stats (Counts)
            const statsRes = await client.get(`/analytics/session/${session._id}/stats`);
            setStats(statsRes.data.data);

            // Fetch Granular Details (Students)
            const detailsRes = await client.get(`/analytics/session/${session._id}/details`);
            setDetails(detailsRes.data.data);
        } catch (e) {
            console.log('Error loading data:', e);
            showAlert('Error', 'Could not load attendance data for this session.', null, 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = async () => {
        if (!selectedSession) return;
        setExportingSession(true);
        try {
            showAlert('Preparing Export', 'Generating CSV...', null, 'info');

            // 1. Fetch CSV data as string
            const res = await client.get(`/analytics/session/${selectedSession._id}/export`);
            const csvString = res.data;
            const fileName = `attendance_${selectedSession._id}.csv`;

            // 2. Handle Web Platform (React Native Web)
            if (Platform.OS === 'web') {
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // 3. Handle Native Mobile Platforms (iOS/Android)
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, csvString);

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Attendance CSV'
                });
            } else {
                showAlert('Export Successful', `Saved locally to: ${fileUri}`, null, 'success');
            }
        } catch (e) {
            console.log('Export error:', e);
            const errorMsg = e.response?.data?.message || 'Failed to export and share CSV';
            showAlert('Export Failed', errorMsg, null, 'error');
        } finally {
            setExportingSession(false);
        }
    };

    const exportMonthlyCSV = async () => {
        if (!selectedSession || !selectedSession.subject) return;
        setExportMonthly(true);
        try {
            showAlert('Preparing Export', 'Generating Monthly CSV...', null, 'info');

            const subjectId = typeof selectedSession.subject === 'object' ? selectedSession.subject._id : selectedSession.subject;
            const dateObj = new Date(selectedSession.startTime);
            const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

            const res = await client.get(`/analytics/subject/${subjectId}/month/${monthStr}/export`);
            const csvString = res.data;
            const fileName = `monthly_attendance_${monthStr}.csv`;

            if (Platform.OS === 'web') {
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, csvString);

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Monthly Attendance'
                });
            } else {
                showAlert('Export Successful', `Saved locally to: ${fileUri}`, null, 'success');
            }
        } catch (e) {
            console.log('Export Monthly error:', e);
            const errorMsg = e.response?.data?.message || 'Failed to export monthly CSV. Ensure there is data.';
            showAlert('Export Failed', errorMsg, null, 'error');
        } finally {
            setExportMonthly(false);
        }
    };

    if (loading && !selectedSession) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics Dashboard</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <Card style={styles.card}>
                    <Card.Content>
                        <CustomDropdown
                            label="Select a Class Session"
                            placeholder="Choose Session"
                            options={sessions.map(s => ({ ...s, displayLabel: `${s.subject?.name} | ${new Date(s.startTime).toLocaleDateString()}` }))}
                            selectedValue={selectedSession ? { ...selectedSession, displayLabel: `${selectedSession.subject?.name} | ${new Date(selectedSession.startTime).toLocaleDateString()}` } : null}
                            onSelect={(item) => loadSessionData(item)}
                            labelField="displayLabel"
                            valueField="_id"
                        />
                    </Card.Content>
                </Card>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} />
                ) : selectedSession && stats ? (
                    <View>
                        <Card style={[styles.card, styles.statsCard]}>
                            <Card.Content>
                                <Text style={styles.statsTitle}>Overview Snapshot</Text>

                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>Total Present</Text>
                                    <Text style={styles.statValue}>{stats.totalPresent}</Text>
                                </View>

                                <View style={styles.statRow}>
                                    <Text style={styles.statLabel}>Status</Text>
                                    <Text style={[styles.statusBadge, {
                                        backgroundColor: selectedSession.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9',
                                        color: selectedSession.status === 'ACTIVE' ? '#059669' : '#475569'
                                    }]}>
                                        {selectedSession.status}
                                    </Text>
                                </View>

                                <View style={{ gap: 12, marginTop: 24 }}>
                                    <Button
                                        mode="contained"
                                        icon={exportingSession ? undefined : "download"}
                                        disabled={exportingSession || exportingMonthly}
                                        onPress={exportCSV}
                                        style={styles.exportBtn}
                                        labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                                    >
                                        {exportingSession ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            "Export Session CSV"
                                        )}
                                    </Button>

                                    <Button
                                        mode="outlined"
                                        icon={exportingMonthly ? undefined : "calendar-month"}
                                        disabled={exportingSession || exportingMonthly}
                                        onPress={exportMonthlyCSV}
                                        style={styles.exportOutlineBtn}
                                        labelStyle={{ fontWeight: 'bold', fontSize: 15 }}
                                    >
                                        {exportingMonthly ? (
                                            <ActivityIndicator size="small" color="#0EA5E9" />
                                        ) : (
                                            "Export Monthly Report"
                                        )}
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>

                    <Card style={styles.card}>
                        <Card.Content style={{ paddingHorizontal: 0 }}>
                            <Text style={[styles.cardTitle, { paddingHorizontal: 16 }]}>Student Roster</Text>
                            <ScrollView horizontal>
                                <View style={[styles.tableContainer, { marginHorizontal: 16 }]}>
                                    <DataTable style={styles.table}>
                                        <DataTable.Header style={{ backgroundColor: '#F8FAFC' }}>
                                            <DataTable.Title style={{ width: 100 }} textStyle={styles.tableHeaderTitle}>Roll No</DataTable.Title>
                                            <DataTable.Title style={{ width: 150 }} textStyle={styles.tableHeaderTitle}>Name</DataTable.Title>
                                            <DataTable.Title style={{ width: 100 }} textStyle={styles.tableHeaderTitle}>Status</DataTable.Title>
                                            <DataTable.Title style={{ width: 80 }} textStyle={styles.tableHeaderTitle}>Verified</DataTable.Title>
                                        </DataTable.Header>

                                        {details.map((row) => (
                                            <DataTable.Row key={row._id} style={styles.tableRow}>
                                                <DataTable.Cell style={{ width: 100 }}>
                                                    <Text style={{ fontWeight: '600', color: '#1E293B' }}>{row.studentId}</Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ width: 150 }}>{`${row.firstName} ${row.lastName}`}</DataTable.Cell>
                                                <DataTable.Cell style={{ width: 100 }}>
                                                    <Text style={{ color: row.status === 'PRESENT' ? '#059669' : '#E11D48', fontWeight: '500' }}>
                                                        {row.status}
                                                    </Text>
                                                </DataTable.Cell>
                                                <DataTable.Cell style={{ width: 80 }}>{row.locationVerified ? '✅' : '❌'}</DataTable.Cell>
                                            </DataTable.Row>
                                        ))}

                                        {details.length === 0 && (
                                            <Paragraph style={styles.emptyText}>No students have checked in yet.</Paragraph>
                                        )}
                                    </DataTable>
                                </View>
                            </ScrollView>
                        </Card.Content>
                    </Card>
                </View>
            ) : (
                <Paragraph style={styles.emptyText}>No historical classes found. Start a class to generate analytics.</Paragraph>
            )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    contentContainer: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },

    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        letterSpacing: 0.5
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
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8
    },

    statsCard: {
        backgroundColor: '#F0F9FF', // Light elegant blue
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },

    statsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0369A1',
        marginBottom: 12
    },

    dropdownBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        borderRadius: 8,
        borderColor: '#94A3B8',
        borderWidth: 1.5
    },

    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0F2FE'
    },

    statLabel: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '600'
    },

    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A'
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center'
    },

    exportBtn: {
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
        paddingVertical: 4,
        elevation: 2
    },

    exportOutlineBtn: {
        borderRadius: 12,
        borderColor: '#0284C7',
        borderWidth: 1.5,
        paddingVertical: 2
    },

    tableContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },

    table: {
        minWidth: 430,
        backgroundColor: '#FFFFFF'
    },

    tableHeaderTitle: {
        fontWeight: 'bold',
        color: '#64748B',
        fontSize: 14
    },

    tableRow: {
        borderBottomColor: '#F1F5F9',
        borderBottomWidth: 1
    },

    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 16,
        fontStyle: 'italic',
        color: '#94A3B8',
        paddingHorizontal: 20
    }
});

export default FacultyAnalytics;
