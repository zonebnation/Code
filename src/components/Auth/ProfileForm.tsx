import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Camera, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase-init';
import { useNavigate } from 'react-router-dom';

const ProfileForm: React.FC = () => {
  const { colors } = useTheme();
  const { user, profile, loading, updateProfile, error } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Auto-redirect to editor after successful profile update
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        navigate('/editor', { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    
    try {
      setValidationError(null);
      await updateProfile({ 
        username,
        avatar_url: avatarUrl
      });
      
      setSaveSuccess(true);
    } catch (err) {
      console.error('Profile update failed:', err);
      setValidationError('Failed to update profile');
    }
  };

  const handleSelectImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const file = target.files[0];
      await uploadAvatar(file);
    };
    
    input.click();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      setUploadError(null);
      
      // Since bucket creation through client side is not allowed,
      // we'll try to use an existing bucket
      try {
        // Check if storage is accessible
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
          console.error("Storage API error:", error);
          throw new Error(`Storage API error: ${error.message}`);
        }
        
        // Check if avatars bucket exists
        const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
        if (!avatarsBucket) {
          throw new Error("Avatars storage bucket not found - please create it in the Supabase dashboard");
        }
        
        console.log("Storage buckets available:", buckets);
      } catch (error) {
        console.error("Error checking storage:", error);
        setUploadError("Storage access unavailable. The avatars bucket needs to be created by an admin in the Supabase dashboard.");
        setUploading(false);
        return;
      }
      
      const filePath = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        setUploadError(`Upload failed: ${uploadError.message}`);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log("Avatar uploaded successfully, URL:", publicUrl);
      setAvatarUrl(publicUrl);
      
      // Update profile immediately with new avatar URL
      if (publicUrl) {
        await updateProfile({ 
          username,
          avatar_url: publicUrl
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-form">
      <h2 className="title" style={{ color: colors.text }}>Your Profile</h2>
      
      {(error || validationError) && (
        <div 
          className="error-container" 
          style={{ backgroundColor: `${colors.error}20`, color: colors.error }}
        >
          <p className="error-text">{validationError || error}</p>
        </div>
      )}
      
      {uploadError && (
        <div 
          className="error-container" 
          style={{ backgroundColor: `${colors.error}20`, color: colors.error }}
        >
          <p className="error-text">{uploadError}</p>
        </div>
      )}
      
      {saveSuccess && (
        <div 
          className="success-container" 
          style={{ backgroundColor: `${colors.success}20`, color: colors.success }}
        >
          <p className="success-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={18} /> Profile updated successfully!
          </p>
        </div>
      )}

      <div className="avatar-container">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profile avatar" 
            className="avatar"
            onError={(e) => {
              console.log("Error loading avatar image");
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://placehold.co/100x100/3794FF/FFFFFF?text=User";
            }}
          />
        ) : (
          <div 
            className="avatar-placeholder" 
            style={{ backgroundColor: colors.border }}
          >
            <User size={40} color={colors.textSecondary} />
          </div>
        )}
        
        <button 
          className="change-avatar-button"
          onClick={handleSelectImage}
          disabled={uploading}
          style={{ backgroundColor: colors.primary }}
          type="button"
        >
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <Camera size={16} color="white" className="button-icon" />
              <span>Change</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleUpdateProfile}>
        <div className="input-group">
          <label htmlFor="username" style={{ color: colors.textSecondary }}>Username</label>
          <div 
            className="input-container" 
            style={{ borderColor: colors.border, backgroundColor: colors.background }}
          >
            <User size={20} color={colors.textSecondary} className="input-icon" />
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ color: colors.text }}
              autoFocus
            />
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="email" style={{ color: colors.textSecondary }}>Email</label>
          <div 
            className="input-container" 
            style={{ borderColor: colors.border, backgroundColor: colors.background }}
          >
            <Mail size={20} color={colors.textSecondary} className="input-icon" />
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="disabled"
              style={{ color: colors.textSecondary }}
            />
          </div>
          <p className="helper-text" style={{ color: colors.textSecondary }}>Email cannot be changed</p>
        </div>
        
        <button
          type="submit"
          className="save-button"
          disabled={loading || uploading || saveSuccess}
          style={{ backgroundColor: colors.primary, opacity: (loading || uploading || saveSuccess) ? 0.7 : 1 }}
        >
          {loading ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save Changes')}
        </button>
      </form>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-form {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .error-container, .success-container {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .error-text, .success-text {
          font-size: 14px;
        }
        
        .avatar-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid ${colors.primary}40;
        }
        
        .avatar-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .change-avatar-button {
          position: absolute;
          bottom: -10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          color: white;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          min-height: 32px;
        }
        
        .change-avatar-button:disabled {
          opacity: 0.7;
        }
        
        .button-icon {
          margin-right: 4px;
        }
        
        .input-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          border-width: 1px;
          border-style: solid;
          border-radius: 8px;
          height: 48px;
          overflow: hidden;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
        }
        
        input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          padding: 0 12px 0 40px;
          font-size: 16px;
          outline: none;
        }
        
        input.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .helper-text {
          font-size: 12px;
          margin-top: 4px;
          margin-left: 2px;
        }
        
        .save-button {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          min-height: 48px;
        }
        
        .save-button:disabled {
          cursor: not-allowed;
        }
        
        @media (max-width: 480px) {
          .profile-form {
            padding: 16px;
          }
          
          .avatar {
            width: 80px;
            height: 80px;
          }
          
          .avatar-placeholder {
            width: 80px;
            height: 80px;
          }
        }
      `}} />
    </div>
  );
};

export default ProfileForm;