import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown, Check } from 'lucide-react-native';

interface FontSizePickerProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
}

const FontSizePicker: React.FC<FontSizePickerProps> = ({
  value,
  onChange,
  min = 8,
  max = 32
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [error, setError] = useState<string | null>(null);

  const fontSizes = [10, 12, 14, 16, 18, 20, 24];

  const handleValueChange = (val: string) => {
    setTempValue(val);
    const numValue = parseInt(val, 10);
    
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
    } else if (numValue < min) {
      setError(`Minimum size is ${min}`);
    } else if (numValue > max) {
      setError(`Maximum size is ${max}`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = () => {
    const numValue = parseInt(tempValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
      setIsModalVisible(false);
    }
  };

  const selectPreset = (size: number) => {
    onChange(size);
    setIsModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={[styles.pickerText, { color: colors.text }]}>
          {value}px
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Font Size</Text>

            <View style={styles.presetSizes}>
              {fontSizes.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.presetButton,
                    { 
                      backgroundColor: value === size ? colors.primary : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => selectPreset(size)}
                >
                  <Text 
                    style={[
                      styles.presetText, 
                      { color: value === size ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {size}px
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customInputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Custom size:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                ]}
                value={tempValue}
                onChangeText={handleValueChange}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { 
                    backgroundColor: error ? colors.border : colors.primary,
                    opacity: error ? 0.5 : 1
                  }
                ]}
                onPress={handleSubmit}
                disabled={!!error}
              >
                <Check size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={!!error}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
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
    minWidth: 80,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 8,
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
  presetSizes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  presetButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  presetText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default FontSizePicker;