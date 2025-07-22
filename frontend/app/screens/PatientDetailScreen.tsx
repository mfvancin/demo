import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChartData } from 'react-native-chart-kit/dist/HelperTypes';
import { RecoveryProcess, Patient, Medication, PatientDetails, MovementData } from '../types';
import { useTheme } from '../theme/ThemeContext';
import ChartCard from '@components/ChartCard';
import AssignmentModal from '@components/AssignmentModal';
import PatientDetailsCard from '@components/PatientDetailsCard';
import MovementDataDisplay from '@components/MovementDataDisplay';
import Avatar from '@components/Avatar';
import { useHealth } from '@context/HealthContext';
import { usePatients } from '@context/PatientContext';
import * as DocumentPicker from 'expo-document-picker';
import movementService from '@services/movementService';

const MotionVisualizerSection = ({ movementData, colors }: { movementData: MovementData, colors: any }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const maxFrames = movementData.segmentOrientations?.length || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % maxFrames);
    }, 50); // 20fps animation
    return () => clearInterval(interval);
  }, [maxFrames]);

  const currentOrientation = movementData.segmentOrientations?.[currentFrame];

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Motion Visualization</Text>
      <View style={styles.avatarContainer}>
        <Avatar
          orientations={{
            rightThigh: currentOrientation?.femur,
            rightShin: currentOrientation?.tibia,
            rightFoot: currentOrientation?.foot,
          }}
        />
      </View>
    </View>
  );
};

const MotionMetricsSection = ({ movementData, colors }: { movementData: MovementData, colors: any }) => {
  // Calculate range of motion metrics
  const calculateRangeOfMotion = () => {
    if (!movementData.segmentOrientations?.length) return null;

    let maxKneeFlexion = 0;
    let maxKneeExtension = 180;
    let maxAnkleFlexion = 0;
    let maxAnkleDorsiflexion = 0;

    movementData.segmentOrientations.forEach(orientation => {
      // Calculate knee angle between femur and tibia
      const kneeAngle = movementService.calculateJointAngle(orientation.femur, orientation.tibia);
      maxKneeFlexion = Math.max(maxKneeFlexion, kneeAngle);
      maxKneeExtension = Math.min(maxKneeExtension, kneeAngle);

      // Calculate ankle angle between tibia and foot
      const ankleAngle = movementService.calculateJointAngle(orientation.tibia, orientation.foot);
      if (ankleAngle > 90) {
        maxAnkleFlexion = Math.max(maxAnkleFlexion, ankleAngle - 90);
      } else {
        maxAnkleDorsiflexion = Math.max(maxAnkleDorsiflexion, 90 - ankleAngle);
      }
    });

    return {
      kneeFlexion: maxKneeFlexion.toFixed(1),
      kneeExtension: maxKneeExtension.toFixed(1),
      ankleFlexion: maxAnkleFlexion.toFixed(1),
      ankleDorsiflexion: maxAnkleDorsiflexion.toFixed(1),
    };
  };

  const metrics = calculateRangeOfMotion();

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Range of Motion</Text>
      {metrics ? (
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.rangeMetricValue, { color: colors.text }]}>{metrics.kneeFlexion}°</Text>
            <Text style={[styles.rangeMetricLabel, { color: colors.textSecondary }]}>Max Knee Flexion</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.rangeMetricValue, { color: colors.text }]}>{metrics.kneeExtension}°</Text>
            <Text style={[styles.rangeMetricLabel, { color: colors.textSecondary }]}>Max Knee Extension</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.rangeMetricValue, { color: colors.text }]}>{metrics.ankleFlexion}°</Text>
            <Text style={[styles.rangeMetricLabel, { color: colors.textSecondary }]}>Max Ankle Flexion</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.rangeMetricValue, { color: colors.text }]}>{metrics.ankleDorsiflexion}°</Text>
            <Text style={[styles.rangeMetricLabel, { color: colors.textSecondary }]}>Max Dorsiflexion</Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No motion data available</Text>
      )}
    </View>
  );
};

const PatientDetailScreen = ({ route, navigation }: any) => {
    const { colors } = useTheme();
    const { patientId, role, completedExerciseId } = route.params;
    const { patients } = usePatients();
    const patientData = patients[patientId];
    const { healthData } = useHealth();

    const [exercises, setExercises] = useState<RecoveryProcess[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [assignmentType, setAssignmentType] = useState<'exercise' | 'medication' | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<RecoveryProcess | null>(null);
    const [movementData, setMovementData] = useState(patientData.movementData?.[0]);

    useEffect(() => {
        if (patientData) {
            setExercises(patientData.recovery_process);
            setMedications(patientData.medications || []);
        }
    }, [patientData]);

    useEffect(() => {
        if (completedExerciseId) {
            handleToggleComplete(completedExerciseId, 'exercise');
            navigation.setParams({ completedExerciseId: null });
        }
    }, [completedExerciseId]);

    const handleToggleComplete = (id: string, type: 'exercise' | 'medication') => {
        if (role !== 'patient') {
          return;
        }

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
                assignedDate: new Date().toISOString(),
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

    const handleUpdateDetails = (details: Partial<PatientDetails>) => {
        // In a real app, this would update the backend
        console.log('Updating patient details:', details);
    };

    const handleUploadMovementData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/zip',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                const data = await movementService.processZipFile(result.assets[0].uri);
                if (data.jointPositions || data.segmentOrientations || data.gaitParameters) {
                    setMovementData({
                        jointPositions: data.jointPositions || [],
                        segmentOrientations: data.segmentOrientations || [],
                        gaitParameters: data.gaitParameters || [],
                        timestamp: new Date().toISOString(),
                        exerciseId: selectedExercise?.id || '',
                    });
                }
            }
        } catch (error) {
            console.error('Error uploading movement data:', error);
        }
    };

    const renderExerciseItem = ({ item }: { item: RecoveryProcess }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => {
                if (role === 'patient') {
                    navigation.navigate('ExerciseDetail', { exercise: item });
                } else {
                    setSelectedExercise(item);
                }
            }}
        >
            <Ionicons
                name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={item.completed ? colors.primary : colors.textSecondary}
            />
            <View style={styles.exerciseInfo}>
                <Text style={item.completed ? [styles.itemTextCompleted, { color: colors.textSecondary }] : [styles.itemText, { color: colors.text }]}>
                    {item.name}
                </Text>
                {item.assignedDate && (
                    <Text style={[styles.assignedDate, { color: colors.textSecondary }]}>
                        Assigned: {new Date(item.assignedDate).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (!patientData || !patientData.details) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <View style={styles.container}>
                    <Text style={[styles.title, { color: colors.text }]}>Patient data not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <PatientDetailsCard
                    details={patientData.details}
                    feedback={patientData.feedback}
                    onUpdateDetails={handleUpdateDetails}
                    isEditable={role === 'doctor'}
                />

                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned Exercises</Text>
                        {role === 'doctor' && (
                            <TouchableOpacity onPress={() => openModal('exercise')}>
                                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <FlatList
                        data={exercises}
                        renderItem={renderExerciseItem}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                    />
                </View>

                {selectedExercise && role === 'doctor' && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Movement Data</Text>
                            <TouchableOpacity onPress={handleUploadMovementData}>
                                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {movementData ? (
                            <>
                                <MotionVisualizerSection movementData={movementData} colors={colors} />
                                <MotionMetricsSection movementData={movementData} colors={colors} />
                                <MovementDataDisplay
                                    jointPositions={movementData.jointPositions}
                                    segmentOrientations={movementData.segmentOrientations}
                                    gaitParameters={movementData.gaitParameters}
                                />
                            </>
                        ) : (
                            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                                Upload movement data to view analysis
                            </Text>
                        )}
                    </View>
                )}

                {medications.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Medications</Text>
                            {role === 'doctor' && (
                                <TouchableOpacity onPress={() => openModal('medication')}>
                                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <FlatList
                            data={medications}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.itemContainer}
                                    onPress={() => role === 'patient' && handleToggleComplete(item.id, 'medication')}
                                >
                                    <Ionicons
                                        name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                                        size={28}
                                        color={item.completed ? colors.primary : colors.textSecondary}
                                    />
                                    <View>
                                        <Text style={item.completed ? [styles.itemTextCompleted, { color: colors.textSecondary }] : [styles.itemText, { color: colors.text }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.dosage, { color: colors.textSecondary }]}>{item.dosage}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {healthData && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Metrics</Text>
                        <View style={styles.healthMetrics}>
                            <View style={styles.metric}>
                                <Ionicons name="walk-outline" size={24} color={colors.primary} />
                                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthData.steps}</Text>
                                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Steps</Text>
                            </View>
                            <View style={styles.metric}>
                                <Ionicons name="flame-outline" size={24} color={colors.primary} />
                                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthData.calories}</Text>
                                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Calories</Text>
                            </View>
                            <View style={styles.metric}>
                                <Ionicons name="time-outline" size={24} color={colors.primary} />
                                <Text style={[styles.healthMetricValue, { color: colors.text }]}>{healthData.activeMinutes}</Text>
                                <Text style={[styles.healthMetricLabel, { color: colors.textSecondary }]}>Active Min</Text>
                            </View>
                        </View>
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
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    itemText: {
        fontSize: 16,
        marginBottom: 4,
    },
    itemTextCompleted: {
        fontSize: 16,
        textDecorationLine: 'line-through',
        marginBottom: 4,
    },
    assignedDate: {
        fontSize: 12,
    },
    itemDosage: {
        fontSize: 14,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
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
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    exerciseInfo: {
        marginLeft: 12,
    },
    dosage: {
        fontSize: 14,
        marginTop: 2,
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        marginVertical: 20,
    },
    healthMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    metric: {
        alignItems: 'center',
    },
    healthMetricValue: {  // Renamed from metricValue
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    healthMetricLabel: {  // Renamed from metricLabel
        fontSize: 14,
    },
    avatarContainer: {
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 16,
    },
    metricItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 16,
    },
    rangeMetricValue: {  // Renamed from metricValue
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    rangeMetricLabel: {  // Renamed from metricLabel
        fontSize: 14,
        textAlign: 'center',
        color: '#666',
    },
});

export default PatientDetailScreen; 