import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChartData } from 'react-native-chart-kit/dist/HelperTypes';
import { RecoveryProcess, WeeklyLog, Patient, Medication } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { mockPatients } from '@data/mockPatients';
import ChartCard from '@components/ChartCard';
import AssignmentModal from '@components/AssignmentModal';

const PatientDetailScreen = ({ route, navigation }: any) => {
    const { colors } = useTheme();
    const { patientId, role } = route.params;
    const patientData = mockPatients[patientId];

    const [exercises, setExercises] = useState<RecoveryProcess[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [assignmentType, setAssignmentType] = useState<'exercise' | 'medication' | null>(null);

    useEffect(() => {
        if (patientData) {
            setExercises(patientData.recovery_process);
            setMedications(patientData.medications || []);
        }
    }, [patientData]);

    const handleToggleComplete = (id: string, type: 'exercise' | 'medication') => {
        if (role !== 'patient') return; // Only patients can toggle completion

        if (type === 'exercise') {
            setExercises(current =>
                current.map(ex => (ex.id === id ? { ...ex, completed: !ex.completed } : ex))
            );
        } else {
            setMedications(current =>
                current.map(med => (med.id === id ? { ...med, completed: !med.completed } : med))
            );
        }
    };

    const openModal = (type: 'exercise' | 'medication') => {
        setAssignmentType(type);
        setModalVisible(true);
    };

    const handleAddAssignment = (name: string, dosage?: string) => {
        if (assignmentType === 'exercise') {
            const newExercise: RecoveryProcess = {
                id: `rp${Date.now()}`,
                name,
                completed: false,
            };
            setExercises(current => [...current, newExercise]);
        } else if (assignmentType === 'medication') {
            const newMedication: Medication = {
                id: `med${Date.now()}`,
                name,
                dosage: dosage || '',
                completed: false,
            };
            setMedications(current => [...current, newMedication]);
        }
    };

    const getChartData = (logs: WeeklyLog[], key: keyof WeeklyLog): ChartData => {
        return {
            labels: logs.map(log => `W${log.week}`),
            datasets: [{
                data: logs.map(log => log[key] as number),
            }]
        }
    };

    if (!patientData) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <View style={styles.container}>
                    <Text style={[styles.title, { color: colors.text }]}>Patient not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const completedCount = exercises.filter(p => p.completed).length;
    const totalCount = exercises.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    const renderRecoveryProcess = ({ item }: { item: RecoveryProcess }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => {
                if (role === 'patient') {
                    navigation.navigate('ExerciseDetail', { 
                        exercise: item,
                        onComplete: (id: string) => handleToggleComplete(id, 'exercise')
                    });
                }
            }}
            disabled={role === 'doctor'}
        >
            <Ionicons
                name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={item.completed ? colors.primary : colors.textSecondary}
            />
            <Text style={item.completed ? [styles.itemTextCompleted, { color: colors.textSecondary }] : [styles.itemText, { color: colors.text }]}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderMedication = ({ item }: { item: Medication }) => (
        <TouchableOpacity 
            style={styles.itemContainer}
            onPress={() => handleToggleComplete(item.id, 'medication')}
            disabled={role !== 'patient'}
        >
             <Ionicons
                name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={item.completed ? colors.primary : colors.textSecondary}
            />
            <View style={{ marginLeft: 12 }}>
                <Text style={item.completed ? [styles.itemTextCompleted, { color: colors.textSecondary }] : [styles.itemText, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemDosage, { color: colors.textSecondary }]}>{item.dosage}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>{patientData.name}'s Plan</Text>
                {patientData.doctor && (
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Assigned by {patientData.doctor.name}</Text>
                )}

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.progressContainer}>
                        <Text style={[styles.progressText, { color: colors.text }]}>{`${completedCount} of ${totalCount} Completed`}</Text>
                        <View style={[styles.progressBarBackground, { backgroundColor: colors.mediumGray }]}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                        </View>
                    </View>

                    <FlatList
                        data={exercises}
                        renderItem={renderRecoveryProcess}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        scrollEnabled={false}
                    />
                </View>

                {medications.length > 0 && (
                     <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.progressText, { color: colors.text }]}>Medication</Text>
                        <FlatList
                            data={medications}
                            renderItem={renderMedication}
                            keyExtractor={(item) => item.id}
                            style={styles.list}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {patientData.weekly_logs && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Progress</Text>
                        <ChartCard 
                            title="Pain Level"
                            value={`${patientData.weekly_logs[patientData.weekly_logs.length - 1].pain}/10`}
                            icon={<Ionicons name="bandage-outline" size={20} color={colors.primary} />}
                            chartData={getChartData(patientData.weekly_logs, 'pain')}
                        />
                        <ChartCard 
                            title="Discomfort Level"
                            value={`${patientData.weekly_logs[patientData.weekly_logs.length - 1].discomfort}/10`}
                            icon={<Ionicons name="body-outline" size={20} color={colors.primary} />}
                            chartData={getChartData(patientData.weekly_logs, 'discomfort')}
                        />
                         <ChartCard 
                            title="Tiredness"
                            value={`${patientData.weekly_logs[patientData.weekly_logs.length - 1].tiredness}/10`}
                            icon={<Ionicons name="battery-half-outline" size={20} color={colors.primary} />}
                            chartData={getChartData(patientData.weekly_logs, 'tiredness')}
                        />
                         <ChartCard 
                            title="Strength"
                            value={`${patientData.weekly_logs[patientData.weekly_logs.length - 1].strength}/10`}
                            icon={<Ionicons name="barbell-outline" size={20} color={colors.primary} />}
                            chartData={getChartData(patientData.weekly_logs, 'strength')}
                        />
                    </>
                )}

                {role === 'patient' ? (
                    <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Logbook')}>
                        <Text style={[styles.logButtonText, { color: colors.white }]}>Log Weekly Feelings</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.doctorActions}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => openModal('exercise')}>
                            <Ionicons name="add-circle-outline" size={22} color={colors.white} />
                            <Text style={[styles.actionButtonText, { color: colors.white }]}>Assign Exercise</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => openModal('medication')}>
                             <Ionicons name="medkit-outline" size={22} color={colors.white} />
                            <Text style={[styles.actionButtonText, { color: colors.white }]}>Assign Medication</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
             {role === 'doctor' && assignmentType && (
                <AssignmentModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleAddAssignment}
                    assignmentType={assignmentType}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        fontWeight: '500',
        marginBottom: 20,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressText: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    progressBarBackground: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
    },
    list: {
        marginTop: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 17,
        marginLeft: 12,
    },
    itemTextCompleted: {
        fontSize: 17,
        marginLeft: 12,
        textDecorationLine: 'line-through',
    },
    itemDosage: {
        fontSize: 14,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 16,
    },
    logButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
    },
    logButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
    doctorActions: {
        marginVertical: 20,
        paddingHorizontal: 8,
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionButtonText: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default PatientDetailScreen; 