import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { activityData, stepsData, heartRateData } from '@data/mockHealthData';
import { mockPatients } from '@data/mockPatients';
import ActivityRings from '@components/ActivityRings';
import ChartCard from '@components/ChartCard';

const PatientHomeScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const patient = mockPatients['1'];
    const recoveryPlan = {
        total: patient.recovery_process.length,
        completed: patient.recovery_process.filter(p => p.completed).length,
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Summary</Text>

                <ActivityRings data={activityData} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights</Text>
                
                <ChartCard 
                    title="Steps"
                    value={stepsData.value.toLocaleString()}
                    icon={<Ionicons name="walk-outline" size={20} color={colors.primary} />}
                    chartData={stepsData.chartData}
                />

                <ChartCard 
                    title="Heart Rate"
                    value={`${heartRateData.value} BPM`}
                    icon={<Ionicons name="heart" size={20} color={colors.primary} />}
                    chartData={heartRateData.chartData}
                />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recovery Plan</Text>

                <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('PatientDetail', { patientId: '1', role: 'patient' })}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Exercises</Text>
                    <View style={styles.cardDetail}>
                        <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>{`${recoveryPlan.completed} of ${recoveryPlan.total} completed`}</Text>
                        <Ionicons name="chevron-forward" size={22} color={colors.darkGray} />
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
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
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    cardDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    cardDetailText: {
        fontSize: 16,
    },
});

export default PatientHomeScreen; 