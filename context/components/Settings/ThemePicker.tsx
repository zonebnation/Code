import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Check } from 'lucide-react-native';
import { ColorTheme } from '@/context/SettingsContext';

interface ThemePickerProps {
  value: ColorTheme;
  onChange: (theme: ColorTheme) => void;
  isDark: boolean;
}

const ThemePicker: React.FC<ThemePickerProps> = ({
  value,
  onChange,
  isDark
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const themes: { id: ColorTheme; name: string; description: string }[] = [
    { 
      id: 'default', 
      name: isDark ? 'Dark+' : 'Light+', 
      description: 'The default Code Canvas theme' 
    },
    { 
      id: 'github', 
      name: isDark ? 'GitHub Dark' : 'GitHub Light', 
      description: 'Based on GitHub\'s coding theme' 
    },
    { 
      id: 'monokai', 
      name: 'Monokai', 
      description: 'Classic dark theme with vibrant colors' 
    },
    { 
      id: 'solarized', 
      name: isDark ? 'Solarized Dark' : 'Solarized Light', 
      description: 'Eye-friendly color scheme' 
    }
  ];

  const handleSelect = (theme: ColorTheme) => {
    onChange(theme);
    setIsModalVisible(false);
  };

  const currentTheme = themes.find(t => t.id === value) || themes[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={[styles.pickerText, { color: colors.text }]}>
          {currentTheme.name}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
            
            <ScrollView style={styles.themeList}>
              {themes.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeItem,
                    { borderBottomColor: colors.border }
                  ]}
                  onPress={() => handleSelect(theme.id)}
                >
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: colors.text }]}>
                      {theme.name}
                    </Text>
                    <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                      {theme.description}
                    </Text>
                  </View>
                  
                  {value === theme.id && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    minWidth: 120,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    marginBottom: 16,
  },
  themeList: {
    maxHeight: 300,
  },
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 2,
  },
  themeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  closeButton: {
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default ThemePicker;