import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Github as GitHub, Mail, Lock, ToggleLeft as Google } from 'lucide-react-native';

interface SignInProps {
  onSwitch: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSwitch }) => {
  const { colors } = useTheme();
  const { signIn, signInWithGithub, signInWithGoogle, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSignIn = async () => {
    // Simple validation
    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }
    
    if (!password) {
      setValidationError('Please enter your password');
      return;
    }
    
    setValidationError(null);
    await signIn(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>
      
      {(error || validationError) && (
        <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{validationError || error}</Text>
        </View>
      )}

      <View style={styles.form}>
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
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: colors.primary }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
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
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>Don't have an account?</Text>
        <TouchableOpacity onPress={onSwitch}>
          <Text style={[styles.switchButton, { color: colors.primary }]}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  signInButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
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

export default SignIn;