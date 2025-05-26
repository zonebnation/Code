import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/services/supabase';

const ProfileForm: React.FC = () => {
  const { colors } = useTheme();
  const { user, profile, loading, updateProfile, error } = useAuth();
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    await updateProfile({ 
      username,
      avatar_url: avatarUrl
    });
  };

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      alert('Error selecting image.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    try {
      setUploading(true);
      
      // For web, we need to convert URI to a File object
      let file;
      if (typeof uri === 'string' && uri.startsWith('data:')) {
        // It's a data URI (web)
        const response = await fetch(uri);
        const blob = await response.blob();
        file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      } else {
        // It's a local file URI (mobile)
        const response = await fetch(uri);
        const blob = await response.blob();
        file = blob;
      }
      
      const filePath = `avatars/${user.id}-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Your Profile</Text>
      
      {(error || validationError) && (
        <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{validationError || error}</Text>
        </View>
      )}

      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
            <User size={40} color={colors.textSecondary} />
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
          onPress={handleSelectImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Camera size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.changeAvatarText}>Change</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
              style={[styles.input, { color: colors.textSecondary }]}
              value={user?.email || ''}
              editable={false}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>Email cannot be changed</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    bottom: -10,
  },
  buttonIcon: {
    marginRight: 4,
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    width: '100%',
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileForm;