import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { User } from '../types';
import { useTheme } from '../theme/ThemeContext';

// Mock user data, in a real app this would come from an auth context
const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'patient@test.com',
  role: 'patient',
};

const ProfileScreen = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<User>(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);

  const handleSave = () => {
    // In a real app, you would send this to the backend
    setUser({ ...user, name });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.mediumGray }]}>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            {isEditing ? (
              <TextInput style={[styles.input, { color: colors.text }]} value={name} onChangeText={setName} />
            ) : (
              <Text style={[styles.value, { color: colors.textSecondary }]}>{user.name}</Text>
            )}
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.mediumGray }]}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{user.email}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.mediumGray, borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Role</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{user.role}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
           <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor={colors.white}
              onValueChange={toggleTheme}
              value={isDark}
            />
          </View>
        </View>

        {isEditing ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.buttonText, { color: colors.white }]}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => setIsEditing(true)}>
            <Text style={[styles.buttonText, { color: colors.white }]}>Edit Profile</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 17,
  },
  value: {
    fontSize: 17,
  },
  input: {
    fontSize: 17,
    textAlign: 'right',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ProfileScreen; 