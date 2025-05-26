import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Github as GitHub, ToggleLeft as Google } from 'lucide-react-native';

interface SignUpProps {
  onSwitch: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitch }) => {
  const { colors } = useTheme();
  const { signUp, signInWithGithub, signInWithGoogle, loading, error } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSignUp = async () => {
    // Validate inputs
    if (!username.trim()) {
      setValidationError('Please enter a username');
      return;
    }
    
    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    setValidationError(null);
    await signUp(email, password, username);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Code Canvas today</Text>
      
      {(error || validationError) && (
        <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{validationError || error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Username</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.signUpButton, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.signUpButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.dividerContainer}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or continue with</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>
      
      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => signInWithGithub()}
        >
          <GitHub size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => signInWithGoogle()}
        >
          <Google size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>Already have an account?</Text>
        <TouchableOpacity onPress={onSwitch}>
          <Text style={[styles.switchButton, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  signUpButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    marginRight: 4,
  },
  switchButton: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignUp;