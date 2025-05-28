import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  TextInput
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProject } from '@/context/ProjectContext';
import { 
  Plus, 
  FileText, 
  Folder, 
  X 
} from 'lucide-react-native';

const ProjectActions: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject, createNewFile, createNewFolder } = useProject();
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'folder' | null>(null);
  const [name, setName] = useState('');
  
  const toggleActions = () => {
    setIsActionsVisible(!isActionsVisible);
  };
  
  const showNewFileModal = () => {
    setModalType('file');
    setName('');
    setIsActionsVisible(false);
  };
  
  const showNewFolderModal = () => {
    setModalType('folder');
    setName('');
    setIsActionsVisible(false);
  };
  
  const closeModal = () => {
    setModalType(null);
  };
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    
    if (modalType === 'file') {
      await createNewFile(name);
    } else if (modalType === 'folder') {
      await createNewFolder(name);
    }
    
    closeModal();
  };
  
  if (!currentProject) return null;
  
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={toggleActions}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {isActionsVisible && (
          <View 
            style={[
              styles.actionsMenu,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.actionItem}
              onPress={showNewFileModal}
            >
              <FileText size={18} color={colors.text} style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                New File
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={showNewFolderModal}
            >
              <Folder size={18} color={colors.text} style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                New Folder
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <Modal
        visible={modalType !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalType === 'file' ? 'New File' : 'New Folder'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder={modalType === 'file' ? 'Filename' : 'Folder name'}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={closeModal}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.createButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleCreate}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Create
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
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  mainButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsMenu: {
    position: 'absolute',
    bottom: 60,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {
  },
  buttonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});

export default ProjectActions;