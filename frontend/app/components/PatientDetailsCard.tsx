import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { PatientDetails, PatientFeedback } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface PatientDetailsCardProps {
  details: PatientDetails;
  feedback?: PatientFeedback[];
  onUpdateDetails: (details: Partial<PatientDetails>) => void;
  isEditable: boolean;
}

const defaultDetails: PatientDetails = {
  age: 0,
  sex: 'Other',
  height: 0,
  weight: 0,
  bmi: 0,
  clinicalInfo: '',
};

const DetailRow: React.FC<{ label: string; value: string | number; isEditable?: boolean; onChange?: (text: string) => void; multiline?: boolean }> = 
({ label, value, isEditable = false, onChange, multiline = false }) => {
    const { colors } = useTheme();
    return (
    <View style={styles.detailRow}>
      <Text style={[styles.label, { color: colors.text }]}>{label}:</Text>
      {isEditable ? (
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          value={value.toString()}
          onChangeText={onChange}
          keyboardType="default" // Adjust keyboard type as needed
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      ) : (
        <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>
      )}
    </View>
  );
};

const PatientDetailsCard: React.FC<PatientDetailsCardProps> = ({ details, feedback, onUpdateDetails, isEditable }) => {
    const { colors } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState(details);

    const handleUpdate = (field: keyof PatientDetails, value: any) => {
        setEditedDetails(prev => ({ ...prev, [field]: value }));
    };

  const handleSave = () => {
    if (onUpdateDetails) {
      onUpdateDetails(editedDetails);
    }
    setIsEditing(false);
  };

  const renderDetailsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Details</Text>
        {isEditable && (
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Ionicons name={isEditing ? "close" : "pencil"} size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
      </View>

      <View style={styles.grid}>
        <DetailRow label="Age" value={`${details.age} yrs`} />
        <DetailRow label="Sex" value={details.sex} />
        <DetailRow label="Height" value={`${details.height} m`} />
        <DetailRow label="Weight" value={`${details.weight} kg`} />
        <DetailRow label="BMI" value={details.bmi.toFixed(1)} />
      </View>
      <View style={styles.clinicalInfoSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Clinical Information</Text>
        <DetailRow 
            label=""
            value={details.clinicalInfo} 
            isEditable={isEditing}
            onChange={(text) => handleUpdate('clinicalInfo', text)}
            multiline
        />
      </View>
    </View>
  );

  const renderFeedbackSection = () => {
    if (!feedback?.length) {
      return null;
    }
    const latestFeedback = feedback[feedback.length - 1];

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient-Reported Outcomes</Text>
        <Text style={[styles.feedbackDate, { color: colors.textSecondary }]}>
          Latest feedback from {new Date(latestFeedback.timestamp).toLocaleDateString()}
        </Text>

        <View style={styles.feedbackGrid}>
          <View style={styles.feedbackItem}>
            <Text style={[styles.feedbackValue, { color: colors.text }]}>{latestFeedback.pain}</Text>
            <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Pain</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Text style={[styles.feedbackValue, { color: colors.text }]}>{latestFeedback.fatigue}</Text>
            <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Fatigue</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Text style={[styles.feedbackValue, { color: colors.text }]}>{latestFeedback.difficulty}</Text>
            <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Difficulty</Text>
          </View>
        </View>

        <View style={styles.commentsContainer}>
          <Text style={[styles.commentsLabel, { color: colors.text }]}>Patient Comments:</Text>
          <Text style={[styles.comments, { color: colors.textSecondary }]}>{latestFeedback.comments}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderDetailsSection()}
      {renderFeedbackSection()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailsGrid: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    maxWidth: 120,
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  clinicalInfoContainer: {
    marginTop: 8,
  },
  clinicalInfoInput: {
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
    height: 100,
    textAlignVertical: 'top',
  },
  feedbackDate: {
    fontSize: 14,
    marginBottom: 16,
  },
  feedbackGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  feedbackItem: {
    alignItems: 'center',
  },
  feedbackValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feedbackLabel: {
    fontSize: 14,
  },
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
  },
  commentsLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  comments: {
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clinicalInfoSection: {
    marginTop: 16,
  },
});

export default PatientDetailsCard; 