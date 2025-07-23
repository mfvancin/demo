import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { Patient } from '../types';

const PatientCard = ({ item, navigation }: { item: Patient; navigation: any }) => {
    const { colors } = useTheme();
    const completedExercises = item.recovery_process.filter(ex => ex.completed).length;
    const totalExercises = item.recovery_process.length;
    const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

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

            {item.details ? (
                <View style={styles.dataPreview}>
                    <View style={styles.detailsColumn}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Age</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.details.age}</Text>
                        
                        <Text style={[styles.detailLabel, { color: colors.textSecondary, marginTop: 12 }]}>Sex</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.details.sex}</Text>
                    </View>
                    <View style={styles.detailsColumn}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Height</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.details.height} m</Text>
                        
                        <Text style={[styles.detailLabel, { color: colors.textSecondary, marginTop: 12 }]}>Weight</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.details.weight} kg</Text>
                    </View>
                    <View style={styles.detailsColumn}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>BMI</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.details.bmi.toFixed(1)}</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.noDetailsContainer}>
                    <Text style={[styles.noDetailsText, { color: colors.textSecondary }]}>No details available</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    patientCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
    noDetailsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    noDetailsText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    dataPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    detailsColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PatientCard; 