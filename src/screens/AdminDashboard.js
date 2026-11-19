import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Card, Title, Text, TextInput, Snackbar, IconButton, DataTable, Menu, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import CustomDropdown from '../components/CustomDropdown';
import client from '../api/client';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('CLASSES');
    const [refreshing, setRefreshing] = useState(false);
    const [subjectLoading, setSubjectLoading] = useState(false);
    const [studentLoading, setStudentLoading] = useState(false);
    const [facultyLoading, setFacultyLoading] = useState(false);
    const [venueLoading, setVenueLoading] = useState(false);

    // Data State
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [venues, setVenues] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [isDeviceBindingEnabled, setIsDeviceBindingEnabled] = useState(true);

    // Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarColor, setSnackbarColor] = useState('#333');

    const showSnackbar = (msg, type = 'success') => {
        setSnackbarMsg(msg);
        setSnackbarColor(type === 'success' ? '#059669' : '#E11D48');
        setSnackbarVisible(true);
    };

    // Form States
    const [newSubject, setNewSubject] = useState({ name: '', code: '', credits: '3', facultyId: '', facultyName: '' });
    const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', email: '', password: '', studentId: '' });
    const [newFaculty, setNewFaculty] = useState({ firstName: '', lastName: '', email: '', password: '', department: '' });
    const [newVenue, setNewVenue] = useState({ name: '', lat: '', lng: '', radiusMeters: '50' });
    // facultyMenuVisible state removed, handled by CustomDropdown

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [subRes, stuRes, venRes, facRes, settingsRes] = await Promise.all([
                client.get('/admin/subjects'),
                client.get('/admin/students'),
                client.get('/admin/venues'),
                client.get('/admin/faculty'),
                client.get('/admin/settings')
            ]);
            setSubjects(subRes.data.data || []);
            setStudents(stuRes.data.data || []);
            setVenues(venRes.data.data || []);
            setFacultyList(facRes.data.data || []);

            if (settingsRes.data.data) {
                setIsDeviceBindingEnabled(settingsRes.data.data.isDeviceBindingEnabled);
            }
        } catch (error) {
            console.error('Admin Load Error:', error);
            showSnackbar('Failed to load dashboard data', 'error');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateSubject = async () => {
        if (!newSubject.name || !newSubject.code || !newSubject.facultyId) return showSnackbar('Name, Code, and Faculty are required.', 'error');
        setSubjectLoading(true);
        try {
            await client.post('/admin/subjects', {
                name: newSubject.name,
                code: newSubject.code,
                credits: parseInt(newSubject.credits) || 3,
                facultyIds: [newSubject.facultyId]
            });
            showSnackbar('Class mapped successfully', 'success');
            setNewSubject({ name: '', code: '', credits: '3', facultyId: '', facultyName: '' });
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to map class', 'error');
        } finally { setSubjectLoading(false); }
    };

    const handleCreateStudent = async () => {
        if (!newStudent.email || !newStudent.studentId || !newStudent.password) return showSnackbar('Email, ID, and Password required.', 'error');
        setStudentLoading(true);
        try {
            await client.post('/admin/students', newStudent);
            showSnackbar('Student generated successfully', 'success');
            setNewStudent({ firstName: '', lastName: '', email: '', password: '', studentId: '' });
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to add student', 'error');
        } finally { setStudentLoading(false); }
    };

    const handleCreateFaculty = async () => {
        if (!newFaculty.email || !newFaculty.firstName || !newFaculty.password) return showSnackbar('Email, Name, and Password required.', 'error');
        setFacultyLoading(true);
        try {
            await client.post('/admin/faculty', newFaculty);
            showSnackbar('Faculty generated successfully', 'success');
            setNewFaculty({ firstName: '', lastName: '', email: '', password: '', department: '' });
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to add faculty', 'error');
        } finally { setFacultyLoading(false); }
    };

    const handleCreateVenue = async () => {
        if (!newVenue.name || !newVenue.lat || !newVenue.lng) return showSnackbar('Name, Lat, and Lng required.', 'error');
        setVenueLoading(true);
        try {
            await client.post('/admin/venues', {
                name: newVenue.name,
                lat: parseFloat(newVenue.lat),
                lng: parseFloat(newVenue.lng),
                radiusMeters: parseInt(newVenue.radiusMeters) || 50
            });
            showSnackbar('Venue configured successfully', 'success');
            setNewVenue({ name: '', lat: '', lng: '', radiusMeters: '50' });
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to configure venue', 'error');
        } finally { setVenueLoading(false); }
    };

    const handleDelete = async (collection, id) => {
        try {
            await client.delete(`/admin/${collection}/${id}`);
            showSnackbar('Item removed successfully', 'success');
            fetchData();
        } catch (error) {
            showSnackbar('Failed to remove item', 'error');
        }
    };

    const handleToggleDeviceBinding = async () => {
        const newValue = !isDeviceBindingEnabled;
        setIsDeviceBindingEnabled(newValue); // Optimistic UI update
        try {
            await client.put('/admin/settings/device-binding', { isDeviceBindingEnabled: newValue });
            showSnackbar(`Strict Device Binding ${newValue ? 'Enabled' : 'Disabled'}`, 'success');
        } catch (error) {
            setIsDeviceBindingEnabled(!newValue); // Revert on failure
            showSnackbar('Failed to toggle device binding', 'error');
        }
    };

    const handleUnbindStudent = async (id) => {
        try {
            await client.put(`/admin/students/${id}/unbind`);
            showSnackbar('Student device successfully unbound', 'success');
            fetchData();
        } catch (error) {
            showSnackbar('Failed to unbind student device', 'error');
        }
    };

    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollContainer}>
            {['CLASSES', 'STUDENTS', 'FACULTY', 'VENUES', 'SETTINGS'].map(tab => (
                <Button
                    key={tab}
                    mode={activeTab === tab ? 'contained' : 'outlined'}
                    onPress={() => setActiveTab(tab)}
                    style={styles.tabPrimaryBtn}
                    labelStyle={{ color: activeTab === tab ? '#FFF' : '#334155' }}
                >
                    {tab}
                </Button>
            ))}
        </ScrollView>
    );

    const renderClassesTab = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Map New Class to Faculty</Title>
                    <TextInput label="Class Name (e.g. Advanced Databases)" value={newSubject.name} onChangeText={t => setNewSubject({ ...newSubject, name: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Course Code" value={newSubject.code} onChangeText={t => setNewSubject({ ...newSubject, code: t })} style={styles.input} mode="outlined" />

                    <CustomDropdown
                        label="Assign to Faculty"
                        placeholder="Select Faculty Member"
                        options={facultyList.map(fac => ({ ...fac, displayLabel: `${fac.firstName} ${fac.lastName} (${fac.email})` }))}
                        selectedValue={newSubject.facultyId ? { ...facultyList.find(f => f._id === newSubject.facultyId), displayLabel: newSubject.facultyName } : null}
                        onSelect={(fac) => setNewSubject({ ...newSubject, facultyId: fac._id, facultyName: `${fac.firstName} ${fac.lastName}` })}
                        labelField="displayLabel"
                        valueField="_id"
                    />

                    <Button mode="contained" onPress={handleCreateSubject} loading={subjectLoading} disabled={subjectLoading} style={styles.actionBtn}>Create & Assign Class</Button>
                </Card.Content>
            </Card>

            <Title style={styles.sectionHeading}>Existing Classes mapped to Faculty</Title>
            {subjects.map(sub => (
                <Card key={sub._id} style={styles.listCard}>
                    <Card.Title
                        title={`${sub.name} (${sub.code})`}
                        subtitle={`Assigned: ${sub.facultyIds?.map(f => f.firstName + ' ' + f.lastName).join(', ') || 'Nobody'}`}
                        right={(props) => <IconButton {...props} icon="delete" iconColor="#E11D48" onPress={() => handleDelete('subjects', sub._id)} />}
                    />
                </Card>
            ))}
        </View>
    );

    const renderStudentsTab = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Register New Student</Title>
                    <TextInput label="First Name" value={newStudent.firstName} onChangeText={t => setNewStudent({ ...newStudent, firstName: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Last Name" value={newStudent.lastName} onChangeText={t => setNewStudent({ ...newStudent, lastName: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Email Address" value={newStudent.email} onChangeText={t => setNewStudent({ ...newStudent, email: t })} style={styles.input} mode="outlined" autoCapitalize="none" />
                    <TextInput label="Role ID (Roll No)" value={newStudent.studentId} onChangeText={t => setNewStudent({ ...newStudent, studentId: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Temporary Password" value={newStudent.password} onChangeText={t => setNewStudent({ ...newStudent, password: t })} style={styles.input} mode="outlined" secureTextEntry />
                    <Button mode="contained" onPress={handleCreateStudent} loading={studentLoading} disabled={studentLoading} style={styles.actionBtn}>Create Student Account</Button>
                </Card.Content>
            </Card>

            <Title style={styles.sectionHeading}>Registered Students</Title>
            {students.map(stu => (
                <Card key={stu._id} style={styles.listCard}>
                    <Card.Title
                        title={`${stu.firstName} ${stu.lastName} (${stu.studentId})`}
                        subtitle={stu.email}
                        right={(props) => (
                            <View style={{ flexDirection: 'row' }}>
                                <IconButton {...props} icon="cellphone-link-off" iconColor="#F59E0B" onPress={() => handleUnbindStudent(stu._id)} />
                                <IconButton {...props} icon="delete" iconColor="#E11D48" onPress={() => handleDelete('students', stu._id)} />
                            </View>
                        )}
                    />
                </Card>
            ))}
        </View>
    );

    const renderFacultyTab = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Register New Faculty</Title>
                    <TextInput label="First Name" value={newFaculty.firstName} onChangeText={t => setNewFaculty({ ...newFaculty, firstName: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Last Name" value={newFaculty.lastName} onChangeText={t => setNewFaculty({ ...newFaculty, lastName: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Email Address" value={newFaculty.email} onChangeText={t => setNewFaculty({ ...newFaculty, email: t })} style={styles.input} mode="outlined" autoCapitalize="none" />
                    <TextInput label="Department" value={newFaculty.department} onChangeText={t => setNewFaculty({ ...newFaculty, department: t })} style={styles.input} mode="outlined" />
                    <TextInput label="Temporary Password" value={newFaculty.password} onChangeText={t => setNewFaculty({ ...newFaculty, password: t })} style={styles.input} mode="outlined" secureTextEntry />
                    <Button mode="contained" onPress={handleCreateFaculty} loading={facultyLoading} disabled={facultyLoading} style={styles.actionBtn}>Create Faculty Account</Button>
                </Card.Content>
            </Card>

            <Title style={styles.sectionHeading}>Registered Faculty</Title>
            {facultyList.map(fac => (
                <Card key={fac._id} style={styles.listCard}>
                    <Card.Title
                        title={`${fac.firstName} ${fac.lastName}`}
                        subtitle={`${fac.email} - ${fac.department || 'N/A'}`}
                        right={(props) => (
                            <IconButton {...props} icon="delete" iconColor="#E11D48" onPress={() => handleDelete('faculty', fac._id)} />
                        )}
                    />
                </Card>
            ))}
        </View>
    );

    const renderVenuesTab = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Configure Geofence Coordinates</Title>
                    <TextInput label="Venue Name (e.g. Main Hall)" value={newVenue.name} onChangeText={t => setNewVenue({ ...newVenue, name: t })} style={styles.input} mode="outlined" />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput label="Latitude" value={newVenue.lat} onChangeText={t => setNewVenue({ ...newVenue, lat: t })} style={[styles.input, { flex: 1 }]} mode="outlined" keyboardType="numeric" />
                        <TextInput label="Longitude" value={newVenue.lng} onChangeText={t => setNewVenue({ ...newVenue, lng: t })} style={[styles.input, { flex: 1 }]} mode="outlined" keyboardType="numeric" />
                    </View>
                    <TextInput label="Radius (Meters)" value={newVenue.radiusMeters} onChangeText={t => setNewVenue({ ...newVenue, radiusMeters: t })} style={styles.input} mode="outlined" keyboardType="numeric" />
                    <Button mode="contained" onPress={handleCreateVenue} loading={venueLoading} disabled={venueLoading} style={styles.actionBtn}>Add Geofence Target</Button>
                </Card.Content>
            </Card>

            <Title style={styles.sectionHeading}>Active Geofences</Title>
            {venues.map(v => (
                <Card key={v._id} style={styles.listCard}>
                    <Card.Title
                        title={`${v.name}`}
                        subtitle={`Coords: [${v.location.coordinates[1].toFixed(6)}, ${v.location.coordinates[0].toFixed(6)}] | Radius: ${v.radiusMeters}m`}
                        right={(props) => <IconButton {...props} icon="delete" iconColor="#E11D48" onPress={() => handleDelete('venues', v._id)} />}
                    />
                </Card>
            ))}
        </View>
    );

    const renderSettingsTab = () => (
        <View>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Security Configuration</Title>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={styles.settingLabel}>Strict Device Binding</Text>
                            <Text style={styles.settingDescription}>
                                If enabled, students can only log in and mark attendance from their permanently registered mobile device.
                            </Text>
                        </View>
                        <Switch
                            value={isDeviceBindingEnabled}
                            onValueChange={handleToggleDeviceBinding}
                            color="#0EA5E9"
                        />
                    </View>
                </Card.Content>
            </Card>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.fixedTopContainer}>
                <View style={styles.header}>
                    <View>
                        <Title style={styles.headerTitle}>System Admin</Title>
                        <Text style={styles.headerSubtitle}>Global Control Panel</Text>
                    </View>
                    <Button mode="text" onPress={logout} labelStyle={{ color: '#E11D48', fontWeight: 'bold' }}>Logout</Button>
                </View>

                {renderTabs()}
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
            >
                {activeTab === 'CLASSES' && renderClassesTab()}
                {activeTab === 'STUDENTS' && renderStudentsTab()}
                {activeTab === 'FACULTY' && renderFacultyTab()}
                {activeTab === 'VENUES' && renderVenuesTab()}
                {activeTab === 'SETTINGS' && renderSettingsTab()}
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3500}
                style={{ backgroundColor: snackbarColor }}
                action={{ label: 'OK', labelStyle: { color: '#FFF' }, onPress: () => setSnackbarVisible(false) }}
            >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{snackbarMsg}</Text>
            </Snackbar>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    fixedTopContainer: {
        backgroundColor: 'rgba(248, 249, 250, 0.98)',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        paddingBottom: 8,
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        paddingBottom: 6 
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
    headerSubtitle: { fontSize: 16, color: '#64748B' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    contentContainer: { padding: 16, paddingBottom: 60 },
    tabScrollContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 4 },
    tabPrimaryBtn: { marginHorizontal: 4, borderColor: '#0EA5E9', minWidth: 100 },
    card: { marginBottom: 20, borderRadius: 16, backgroundColor: '#FFFFFF', elevation: 4 },
    listCard: { marginBottom: 10, backgroundColor: '#FFF' },
    input: { marginBottom: 12, backgroundColor: '#FCFCFD' },
    menuAnchor: { marginBottom: 16, paddingVertical: 4, borderColor: '#CBD5E1' },
    actionBtn: { marginTop: 8, paddingVertical: 4, backgroundColor: '#0EA5E9', borderRadius: 12 },
    sectionHeading: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginBottom: 12, marginTop: 8 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    settingLabel: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    settingDescription: { fontSize: 13, color: '#64748B' }
});

export default AdminDashboard;
