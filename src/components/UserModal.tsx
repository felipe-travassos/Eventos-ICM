import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/auth';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export const UserModal = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = async () => {
    setModalVisible(false);
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Botão que abre o modal */}
      <TouchableOpacity 
        style={styles.badgeButton} 
        onPress={() => setModalVisible(true)}
      >
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.userImage} />
        ) : (
          <View style={styles.userInitialsContainer}>
            <Text style={styles.userInitials}>
              {user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
            >
              {/* Cabeçalho do Modal */}
              <View style={styles.modalHeader}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.modalUserImage} />
                ) : (
                  <View style={styles.modalUserInitials}>
                    <Text style={styles.modalUserInitialsText}>
                      {user.email?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.displayName || 'Usuário'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>

              {/* Opções do Modal */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => {
                    setModalVisible(false);
                    // navigation.navigate('Profile');
                  }}
                >
                  <MaterialIcons name="edit" size={24} color={theme.colors.text} />
                  <Text style={styles.optionText}>Editar Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => {
                    setModalVisible(false);
                    // navigation.navigate('Settings');
                  }}
                >
                  <MaterialIcons name="settings" size={24} color={theme.colors.text} />
                  <Text style={styles.optionText}>Configurações</Text>
                </TouchableOpacity>

                <View style={styles.divider} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badgeButton: {
    marginRight: 10,
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInitialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 350,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  modalUserImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  modalUserInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalUserInitialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  optionsContainer: {
    paddingVertical: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 15,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 5,
  },
  logoutButton: {
    marginTop: 5,
  },
  logoutText: {
    color: theme.colors.error,
  },
});