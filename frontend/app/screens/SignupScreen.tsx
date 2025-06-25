import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import SegmentedControl from '../components/SegmentedControl';

const SignupScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Patient');

  const handleSignup = () => {
    if (role === 'Doctor') {
      navigation.navigate('DoctorHome');
    } else {
      navigation.navigate('PatientHome');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.mediumGray }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textSecondary}
        />
        <SegmentedControl
          options={['Patient', 'Doctor']}
          selectedValue={role}
          onValueChange={setRole}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSignup}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
      <Image source={require('../../assets/eu.png')} style={styles.footerImage} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 17,
    borderWidth: 1,
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
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  footerImage: {
    width: '100%',
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default SignupScreen; 