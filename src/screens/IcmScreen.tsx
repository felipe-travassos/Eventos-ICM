// src/screens/IcmScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';

import { ScreenContainer } from '../components/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';

import defaultPhoto from '../../assets/img/icm-ghibli.png';
import headerImage from '../../assets/img/church-banner.jpg';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export function IcmScreen({ navigation }: { navigation: any }) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [igrejas, setIgrejas] = useState<any[]>([]);

  // estados para modais
  const [modalCadastroVisible, setModalCadastroVisible] = useState(false);
  const [modalEdicaoVisible, setModalEdicaoVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Pega os insets do dispositivo (notch, barras)
  const insets = useSafeAreaInsets();

  // carga em tempo real
  useEffect(() => {
    const q = query(collection(db, 'igrejas'), orderBy('nome'));
    const unsub = onSnapshot(q, snap =>
      setIgrejas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // abrir modal para nova igreja
  const abrirModalCadastro = () => {
    limparCampos();
    setModalCadastroVisible(true);
  };

  // abrir modal para edição
  const abrirModalEdicao = (item: any) => {
    setNome(item.nome);
    setEndereco(item.endereco);
    setCidade(item.cidade || '');
    setEstado(item.estado || '');
    setCep(item.cep || '');
    setEditandoId(item.id);
    setModalEdicaoVisible(true);
  };

  // checa duplicata
  const igrejaExiste = async (n: string) => {
    const q = query(collection(db, 'igrejas'), where('nome', '==', n.trim()));
    const snap = await getDocs(q);
    if (editandoId) return snap.docs.some(d => d.id !== editandoId);
    return !snap.empty;
  };

  // limpar campos
  const limparCampos = () => {
    setNome('');
    setEndereco('');
    setCidade('');
    setEstado('');
    setCep('');
    setEditandoId(null);
  };

  // fechar todos os modais
  const fecharModais = () => {
    setModalCadastroVisible(false);
    setModalEdicaoVisible(false);
    limparCampos();
  };

  // salvar ou atualizar
  const salvar = async () => {
    const n = nome.toUpperCase().trim(), e = endereco.trim();
    if (!n || !e) {
      return Alert.alert('Campos obrigatórios', 'Preencha nome e endereço.');
    }
    if (await igrejaExiste(n)) {
      return Alert.alert('Duplicado', 'Igreja já cadastrada com esse nome.');
    }
    const dados = {
      nome: n,
      endereco: e,
      cidade: cidade.trim(),
      estado: estado.trim(),
      cep: cep.trim(),
    };
    try {
      if (editandoId) {
        await updateDoc(doc(db, 'igrejas', editandoId), dados);
        Alert.alert('Atualizado', 'Dados da igreja atualizados!');
      } else {
        await addDoc(collection(db, 'igrejas'), dados);
        Alert.alert('Sucesso', 'Igreja cadastrada!');
      }
      fecharModais();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  };

  const excluir = (id: string) => {
    Alert.alert('Confirmação', 'Excluir esta igreja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'igrejas', id));
            Alert.alert('Excluída', 'Igreja removida com sucesso!');
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  };

  // Modal de cadastro
  const renderModalCadastro = () => (
    <Modal
      visible={modalCadastroVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={fecharModais}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nova Igreja</Text>

          <Text style={styles.label}>Nome da Igreja *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome"
            placeholderTextColor={theme.colors.placeholder}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Endereço *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o endereço"
            placeholderTextColor={theme.colors.placeholder}
            value={endereco}
            onChangeText={setEndereco}
          />

          <Text style={styles.label}>Cidade (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a cidade"
            placeholderTextColor={theme.colors.placeholder}
            value={cidade}
            onChangeText={setCidade}
          />

          <Text style={styles.label}>Estado (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o estado"
            placeholderTextColor={theme.colors.placeholder}
            value={estado}
            onChangeText={setEstado}
          />

          <Text style={styles.label}>CEP (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o CEP"
            placeholderTextColor={theme.colors.placeholder}
            value={cep}
            onChangeText={setCep}
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.modalButton]}
              onPress={salvar}
            >
              <Text style={styles.primaryButtonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.modalButton]}
              onPress={fecharModais}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de edição
  const renderModalEdicao = () => (
    <Modal
      visible={modalEdicaoVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={fecharModais}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Igreja</Text>

          <Text style={styles.label}>Nome da Igreja *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome"
            placeholderTextColor={theme.colors.placeholder}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Endereço *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o endereço"
            placeholderTextColor={theme.colors.placeholder}
            value={endereco}
            onChangeText={setEndereco}
          />

          <Text style={styles.label}>Cidade (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a cidade"
            placeholderTextColor={theme.colors.placeholder}
            value={cidade}
            onChangeText={setCidade}
          />

          <Text style={styles.label}>Estado (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o estado"
            placeholderTextColor={theme.colors.placeholder}
            value={estado}
            onChangeText={setEstado}
          />

          <Text style={styles.label}>CEP (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o CEP"
            placeholderTextColor={theme.colors.placeholder}
            value={cep}
            onChangeText={setCep}
            keyboardType="numeric"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.primaryButton, styles.modalButton]}
              onPress={salvar}
            >
              <Text style={styles.primaryButtonText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.modalButton]}
              onPress={fecharModais}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Header do FlatList
  const renderHeader = () => (
    <View>
      {/* Banner no topo */}
      <Image source={headerImage} style={styles.headerImage} />

      {/* Botão para nova igreja */}
      <TouchableOpacity
        style={styles.novaIgrejaButton}
        onPress={abrirModalCadastro}
      >
        <Text style={styles.novaIgrejaButtonText}>
          Adicionar nova Igreja
        </Text>
      </TouchableOpacity>

      {/* Header com ícone */}
      <View style={styles.header}>
        <MaterialIcons
          name="house"
          size={28}
          color={theme.colors.primary}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Igrejas Cadastradas:</Text>
      </View>
    </View>
  );

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
        <FlatList
          contentContainerStyle={styles.container}
          data={igrejas}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={defaultPhoto}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardText}>{item.endereco}</Text>
              {item.cidade && (
                <Text style={styles.cardText}>Cidade: {item.cidade}</Text>
              )}
              {item.estado && (
                <Text style={styles.cardText}>Estado: {item.estado}</Text>
              )}
              {item.cep && (
                <Text style={styles.cardText}>CEP: {item.cep}</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => abrirModalEdicao(item)}>
                  <Text style={styles.edit}>✏️ Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => excluir(item.id)}>
                  <Text style={styles.delete}>🗑️ Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={styles.footer} />}
        />

        {/* Renderizar modais */}
        {renderModalCadastro()}
        {renderModalEdicao()}
      </LinearGradient>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: theme.spacing.large,
    paddingTop: theme.spacing.large,
    paddingBottom: theme.spacing.xlarge,
  },
  headerImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.medium,
    marginBottom: theme.spacing.xlarge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.large,
  },
  headerIcon: {
    marginRight: theme.spacing.small,
  },
  headerTitle: {
    ...theme.textVariants.title,
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center'
  },
  novaIgrejaButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.medium,
    borderRadius: theme.radius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.xlarge,
  },
  novaIgrejaButtonText: {
    ...theme.textVariants.button,
    color: theme.colors.background,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.radius.small,
    marginBottom: theme.spacing.medium,
  },
  cardTitle: {
    ...theme.textVariants.button,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  cardText: {
    ...theme.textVariants.body,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.small,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.small,
    gap: theme.spacing.medium,
  },
  edit: {
    ...theme.textVariants.body,
    color: theme.colors.primary,
  },
  delete: {
    ...theme.textVariants.body,
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.large,
    padding: theme.spacing.xlarge,
    maxHeight: '80%',
  },
  modalTitle: {
    ...theme.textVariants.title,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.medium,
    marginTop: theme.spacing.large,
  },
  modalButton: {
    flex: 1,
  },
  label: {
    ...theme.textVariants.body,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.small,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    color: theme.colors.text,
  },
  primaryButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.textVariants.button,
    color: theme.colors.background,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.textVariants.button,
    color: theme.colors.text,
  },
  footer: {
    height: theme.spacing.xlarge,
  },
});