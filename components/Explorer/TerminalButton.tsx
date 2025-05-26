import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Terminal } from 'lucide-react-native';
import { router } from 'expo-router';

const TerminalButton: React.FC = () => {
  const { colors } = useTheme();

  const openTerminal = () => {
    router.navigate('/(tabs)/terminal');
  };

  return (
    <TouchableOpacity
      style={[
        styles.terminalButton,
        { backgroundColor: colors.primary }
      ]}
      onPress={openTerminal}
    >
      <Terminal size={18} color="#FFFFFF" />
      <Text style={styles.buttonText}>Terminal</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  terminalButton: {
    position: 'absolute',
    bottom: 76, // Place above the project actions button
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  }
});

export default TerminalButton;