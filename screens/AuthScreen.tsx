import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import SignIn from '@/components/Auth/SignIn';
import SignUp from '@/components/Auth/SignUp';
import ProfileForm from '@/components/Auth/ProfileForm';

const AuthScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {user ? (
          <ProfileForm />
        ) : (
          <>
            {mode === 'signin' ? (
              <SignIn onSwitch={() => setMode('signup')} />
            ) : (
              <SignUp onSwitch={() => setMode('signin')} />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
  },
});

export default AuthScreen;