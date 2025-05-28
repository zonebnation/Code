import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Check } from 'lucide-react-native';

interface TabSizePickerProps {
  value: number;
  onChange: (size: number) => void;
}

const TabSizePicker: React.FC<TabSizePickerProps> = ({
  value,
  onChange
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const tabSizes = [2, 4, 8];

  const handleSelect = (size: number) => {
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
          {value} spaces
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Tab Size</Text>
            
            <View style={styles.sizeList}>
              {tabSizes.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeItem,
                    { 
                      backgroundColor: value === size ? colors.primary : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleSelect(size)}
                >
                  <Text 
                    style={[
                      styles.sizeText, 
                      { color: value === size ? '#FFFFFF' : colors.text }
                    ]}
                  >
                    {size} spaces
                  </Text>
                  
                  {value === size && (
                    <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Cancel
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
    paddingHorizontal: 12,
    minWidth: 80,
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
    maxWidth: 300,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  sizeList: {
    marginBottom: 16,
  },
  sizeItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
  },
  sizeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  checkIcon: {
    position: 'absolute',
    right: 12,
  },
  closeButton: {
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});

export default TabSizePicker;