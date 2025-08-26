// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { logout } from '../services/auth';

export const ProfileScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const insets = useSafeAreaInsets();

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setUserInfo(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      }));

      if (user.photoURL) {
        setImage(user.photoURL);
      }
    }
  }, [user]);

  // Selecionar imagem da galeria
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Tirar foto com câmera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua câmera para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Salvar alterações do perfil
  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Atualizar nome
      if (userInfo.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: userInfo.displayName,
          ...(image && { photoURL: image })
        });
      }

      // Atualizar email
      if (userInfo.email !== user.email) {
        await updateEmail(user, userInfo.email);
      }

      // Atualizar senha se fornecida
      if (userInfo.newPassword && userInfo.currentPassword) {
        if (userInfo.newPassword !== userInfo.confirmPassword) {
          Alert.alert('Erro', 'As novas senhas não coincidem');
          setLoading(false);
          return;
        }

        // Reautenticar usuário
        const credential = EmailAuthProvider.credential(
          user.email!,
          userInfo.currentPassword
        );

        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, userInfo.newPassword);
      }

      await reloadUser();
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setEditing(false);

      // Limpar campos de senha
      setUserInfo(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);

      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Erro', 'Por favor, faça login novamente para atualizar suas informações.');
      } else {
        Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirmar logout
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FF']}
        style={[
          styles.gradientContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
            <Text style={styles.headerSubtitle}>Gerencie suas informações pessoais</Text>
          </View>

          {/* Foto de Perfil */}
          <View style={styles.profileImageContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  image
                    ? { uri: image }
                    : user?.photoURL
                      ? { uri: user.photoURL }
                      : require('../../assets/avatar-placeholder.png')
                }
                style={styles.profileImage}
              />

              {editing && (
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="photo-library" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={takePhoto}
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Informações do Usuário */}
          <View style={styles.infoContainer}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={userInfo.displayName}
                  onChangeText={(text) => setUserInfo({ ...userInfo, displayName: text })}
                  placeholder="Seu nome completo"
                />
              ) : (
                <Text style={styles.infoText}>{user?.displayName || 'Não informado'}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={userInfo.email}
                  onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                  placeholder="Seu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoText}>{user?.email || 'Não informado'}</Text>
              )}
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={userInfo.phoneNumber}
                  onChangeText={(text) => setUserInfo({ ...userInfo, phoneNumber: text })}
                  placeholder="Seu telefone"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoText}>{user?.phoneNumber || 'Não informado'}</Text>
              )}
            </View>

            {/* Campos de Senha (apenas no modo edição) */}
            {editing && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha Atual</Text>
                  <TextInput
                    style={styles.input}
                    value={userInfo.currentPassword}
                    onChangeText={(text) => setUserInfo({ ...userInfo, currentPassword: text })}
                    placeholder="Digite sua senha atual"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nova Senha</Text>
                  <TextInput
                    style={styles.input}
                    value={userInfo.newPassword}
                    onChangeText={(text) => setUserInfo({ ...userInfo, newPassword: text })}
                    placeholder="Digite a nova senha"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Nova Senha</Text>
                  <TextInput
                    style={styles.input}
                    value={userInfo.confirmPassword}
                    onChangeText={(text) => setUserInfo({ ...userInfo, confirmPassword: text })}
                    placeholder="Confirme a nova senha"
                    secureTextEntry
                  />
                </View>
              </>
            )}
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionsContainer}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Salvar Alterações</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setEditing(false)}
                  disabled={loading}
                >
                  <MaterialIcons name="close" size={20} color={theme.colors.text} />
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => setEditing(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Editar Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Sair</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Informações adicionais */}
          <View style={styles.additionalInfo}>
            <Text style={styles.infoLabel}>ID do Usuário:</Text>
            <Text style={styles.infoValue}>{user?.uid}</Text>

            <Text style={styles.infoLabel}>Email verificado:</Text>
            <Text style={styles.infoValue}>
              {user?.emailVerified ? '✅ Sim' : '❌ Não'}
            </Text>

            <Text style={styles.infoLabel}>Data de criação:</Text>
            <Text style={styles.infoValue}>
              {user?.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR')
                : 'Não disponível'
              }
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  imageButton: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  infoContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.text,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.otherColor,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  additionalInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
});