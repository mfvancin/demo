import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Patient } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { mockPatients } from '@data/mockPatients';

const DoctorHomeScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    // Convert the mockPatients object to an array for the FlatList
    const patients = Object.values(mockPatients);

    const renderPatient = ({ item }: { item: Patient }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('PatientDetail', { patientId: item.id, role: 'doctor' })}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.cardDetail}>
                <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>{item.recovery_process.length} exercises assigned</Text>
                <Ionicons name="chevron-forward" size={22} color={colors.darkGray} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>Patients</Text>
                <FlatList
                    data={patients}
                    renderItem={renderPatient}
                    keyExtractor={(item) => item.id}
                />
            </View>
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
        marginBottom: 20,
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
    }
});

export default DoctorHomeScreen; 