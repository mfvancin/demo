import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePatients } from '../context/PatientContext';
import { Ionicons } from '@expo/vector-icons';
import type { RecoveryProcess, Patient } from '../types';
import ActivityRings from '@components/ActivityRings';
import ChartCard from '@components/ChartCard';
import Avatar, { AvatarProps } from '@components/Avatar';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    value: string | number;
    label: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
        </View>
    );
};

const PatientCard = ({ item, navigation }: { item: Patient; navigation: any }) => {
    const { colors } = useTheme();
    const completedExercises = item.recovery_process.filter(ex => ex.completed).length;
    const totalExercises = item.recovery_process.length;
    const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

    // Get the latest movement data
    const latestMovement = item.movementData?.[item.movementData.length - 1];
    const latestOrientation = latestMovement?.segmentOrientations?.[0];

    return (
        <TouchableOpacity 
            style={[styles.patientCard, { backgroundColor: colors.card }]} 
            onPress={() => navigation.navigate('PatientDetail', { patientId: item.id, role: 'doctor' })}
        >
            <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.purple[100] }]}>
                        <Text style={[styles.avatarText, { color: colors.purple[600] }]}>
                            {item.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.patientName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.patientSubtext, { color: colors.textSecondary }]}>
                            {`${completedExercises}/${totalExercises} exercises completed`}
                        </Text>
                    </View>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: colors.purple[50] }]}>
                    <Text style={[styles.progressText, { color: colors.purple[500] }]}>
                        {`${Math.round(progress)}%`}
                    </Text>
                </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: colors.gray[200] }]}>
                <View 
                    style={[
                        styles.progressFill, 
                        { 
                            backgroundColor: colors.purple[500],
                            width: `${progress}%` 
                        }
                    ]} 
                />
            </View>

            {latestMovement && (
                <View style={styles.dataPreview}>
                    <View style={styles.avatarPreview}>
                        <Avatar
                            orientations={{
                                rightThigh: latestOrientation?.femur,
                                rightShin: latestOrientation?.tibia,
                                leftThigh: latestOrientation?.femur,
                                leftShin: latestOrientation?.tibia,
                            }}
                            size={120}
                        />
                    </View>
                    <View style={styles.metricsPreview}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Latest Session</Text>
                            <Text style={[styles.metricValue, { color: colors.text }]}>
                                {new Date(latestMovement.timestamp).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Knee ROM</Text>
                            <Text style={[styles.metricValue, { color: colors.text }]}>
                                {`${Math.round(latestMovement.gaitParameters?.[0]?.stepLength || 0)}°`}
                            </Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Ankle ROM</Text>
                            <Text style={[styles.metricValue, { color: colors.text }]}>
                                {`${Math.round(latestMovement.gaitParameters?.[0]?.cadence || 0)}°`}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const DoctorHomeScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { patients } = usePatients();
    const patientList = Object.values(patients);

    const totalPatients = patientList.length;
    const activePatients = patientList.filter(p => p.recovery_process.some(ex => !ex.completed)).length;
    const completedPatients = patientList.filter(p => p.recovery_process.every(ex => ex.completed)).length;
    const averageProgress = patientList.reduce((acc, patient) => {
        const completed = patient.recovery_process.filter(ex => ex.completed).length;
        const total = patient.recovery_process.length;
        return acc + (total > 0 ? (completed / total) * 100 : 0);
    }, 0) / (totalPatients || 1);

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
                        <Text style={[styles.title, { color: colors.text }]}>Dr. Smith</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('CreatePatient')}
                    >
                        <Ionicons name="add" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard 
                        icon="people" 
                        value={totalPatients} 
                        label="Total Patients"
                        color={colors.purple[500]}
                    />
                    <StatCard 
                        icon="fitness" 
                        value={activePatients} 
                        label="Active Patients"
                        color={colors.success}
                    />
                    <StatCard 
                        icon="checkmark-circle" 
                        value={completedPatients} 
                        label="Completed"
                        color={colors.info}
                    />
                    <StatCard 
                        icon="trending-up" 
                        value={`${Math.round(averageProgress)}%`} 
                        label="Avg. Progress"
                        color={colors.warning}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient List</Text>
                <FlatList
                    data={patientList}
                    renderItem={({ item }) => <PatientCard item={item} navigation={navigation} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.patientList}
                    scrollEnabled={false}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 16,
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        minWidth: '47%',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    patientList: {
        gap: 12,
    },
    patientCard: {
        borderRadius: 12,
        padding: 16,
    },
    patientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    patientSubtext: {
        fontSize: 14,
    },
    progressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    dataPreview: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    avatarPreview: {
        width: 120,
        height: 120,
        marginRight: 16,
    },
    metricsPreview: {
        flex: 1,
        justifyContent: 'center',
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 14,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DoctorHomeScreen; 