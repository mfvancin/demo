import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { usePatients } from '../context/PatientContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RecoveryProcess, Medication } from '../types';

interface Exercise {
    name: string;
    completed: boolean;
}

const CreatePatientScreen = () => {
    const { colors } = useTheme();
    const { createPatient } = usePatients();
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [newExercise, setNewExercise] = useState('');
    const [newMedication, setNewMedication] = useState({ name: '', dosage: '' });

    const addExercise = () => {
        if (newExercise.trim()) {
            setExercises([...exercises, { name: newExercise, completed: false }]);
            setNewExercise('');
        }
    };

    const addMedication = () => {
        if (newMedication.name.trim() && newMedication.dosage.trim()) {
            setMedications([
                ...medications,
                {
                    id: `med_${Date.now()}`,
                    name: newMedication.name,
                    dosage: newMedication.dosage,
                    completed: false
                }
            ]);
            setNewMedication({ name: '', dosage: '' });
        }
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Patient name cannot be empty.');
            return;
        }

        if (exercises.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one exercise.');
            return;
        }

        const recovery_process: RecoveryProcess[] = exercises.map((ex, index) => ({
            id: `rp${index + 1}`,
            name: ex.name,
            completed: ex.completed
        }));

        const newPatient = createPatient(name);
        newPatient.recovery_process = recovery_process;
        newPatient.medications = medications;
        
        Alert.alert('Success', `Patient "${name}" created successfully.`, [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>Create New Patient</Text>
                
                {/* Patient Name */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Information</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
                    placeholder="Patient's Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                />

                {/* Exercises Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
                <View style={styles.addSection}>
                    <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
                        placeholder="Exercise Name"
                        value={newExercise}
                        onChangeText={setNewExercise}
                        placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={addExercise}
                    >
                        <Ionicons name="add" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
                {exercises.map((exercise, index) => (
                    <View key={index} style={[styles.itemContainer, { backgroundColor: colors.card }]}>
                        <Text style={[styles.itemText, { color: colors.text }]}>{exercise.name}</Text>
                        <TouchableOpacity onPress={() => removeExercise(index)}>
                            <Ionicons name="close-circle" size={24} color={colors.notification} />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Medications Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Medications</Text>
                <View style={styles.addSection}>
                    <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
                        placeholder="Medication Name"
                        value={newMedication.name}
                        onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
                        placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray, marginLeft: 8 }]}
                        placeholder="Dosage"
                        value={newMedication.dosage}
                        onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                        placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={addMedication}
                    >
                        <Ionicons name="add" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
                {medications.map((medication, index) => (
                    <View key={index} style={[styles.itemContainer, { backgroundColor: colors.card }]}>
                        <View>
                            <Text style={[styles.itemText, { color: colors.text }]}>{medication.name}</Text>
                            <Text style={[styles.dosageText, { color: colors.textSecondary }]}>{medication.dosage}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeMedication(index)}>
                            <Ionicons name="close-circle" size={24} color={colors.notification} />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: colors.primary }]} 
                    onPress={handleSave}
                >
                    <Text style={[styles.saveButtonText, { color: colors.white }]}>Create Patient</Text>
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
        padding: 16,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 12,
    },
    input: {
        height: 50,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 17,
        borderWidth: 1,
    },
    addSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemText: {
        fontSize: 17,
        fontWeight: '500',
    },
    dosageText: {
        fontSize: 14,
        marginTop: 4,
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
});

export default CreatePatientScreen; 