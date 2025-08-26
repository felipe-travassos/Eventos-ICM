// src/screens/tab/SubscriptionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Share,
  Linking
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useEventosStore } from '../../zustand/EventsStore';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';
import {
  createPixPayment,
  getPaymentStatus,
  isMercadoPagoConfigured,
  MercadoPagoPixPayment,
  CreatePixPaymentRequest
} from '../../services/mercadoPagoService';
import { Evento, Inscricao } from '../../zustand/EventsStore';
import QRCode from 'react-native-qrcode-svg';

// CORRIGIDO: Caminho da importação
import fotoDM from '../../../assets/img/fotoDM.png';

const { width } = Dimensions.get('window');

export const SubscriptionScreen = () => {
  const { user } = useAuth();
  const {
    eventos,
    fetchEventos,
    loading,
    inscricoes,
    createInscricao,
    fetchInscricoes,
    unsubscribeEvents,
    unsubscribeInscricoesFn,
    cancelInscricao,
    updateInscricaoStatus
  } = useEventosStore();

  const [apiConfigured, setApiConfigured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [modalInscricaoVisible, setModalInscricaoVisible] = useState(false);
  const [modalAcompanhamentoVisible, setModalAcompanhamentoVisible] = useState(false);
  const [modalPixVisible, setModalPixVisible] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [inscricaoSelecionada, setInscricaoSelecionada] = useState<Inscricao | null>(null);
  const [paymentInterval, setPaymentInterval] = useState<any>(null); // Corrigido

  // Estados para formatação
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [cpfFormatado, setCpfFormatado] = useState('');
  const [telefoneLimpo, setTelefoneLimpo] = useState('');
  const [cpfLimpo, setCpfLimpo] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');

  const [pixPayment, setPixPayment] = useState<MercadoPagoPixPayment | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [loadingInscricoes, setLoadingInscricoes] = useState(false);

  const insets = useSafeAreaInsets();
  const categories = ['Todos', 'Seminários', 'Cultos'];

  // Filtrar apenas eventos ATIVOS
  const eventosAtivos = eventos.filter(evento => evento.status === true);

  // Filtrar eventos para exibir
  const filteredEvents = activeCategory === 'Todos'
    ? eventosAtivos
    : eventosAtivos.filter(evento => evento.nomeSeminario === activeCategory);

  const resetUserInfo = () => {
    setNome(user?.displayName || '');
    setEmail(user?.email || '');
    setTelefoneFormatado('');
    setTelefoneLimpo('');
    setCpfFormatado('');
    setCpfLimpo('');
  };

  // Limpar o intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (paymentInterval) {
        clearInterval(paymentInterval);
      }
    };
  }, [paymentInterval]);

  // Efeito para preencher automaticamente os dados do usuário
  useEffect(() => {
    if (user) {
      setNome(user.displayName || '');
      setEmail(user.email || '');
    } else {
      setNome('');
      setEmail('');
    }
    setTelefoneFormatado('');
    setTelefoneLimpo('');
    setCpfFormatado('');
    setCpfLimpo('');
  }, [user]);

  // Verificar configuração da API ao carregar o componente
  useEffect(() => {
    const configured = isMercadoPagoConfigured();
    setApiConfigured(configured);
  }, []);

  // Efeito principal
  useEffect(() => {
    const loadData = async () => {
      await fetchEventos();
      if (user) {
        await fetchInscricoes(user.uid);
      }
    };

    loadData();

    return () => {
      unsubscribeEvents();
      unsubscribeInscricoesFn();
      if (paymentInterval) {
        clearInterval(paymentInterval);
      }
    };
  }, [user?.uid]);

  // Função para formatar telefone
  const handleTelefoneChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    setTelefoneLimpo(numbers);
    setTelefone(numbers);

    if (numbers.length <= 2) {
      setTelefoneFormatado(numbers);
    } else if (numbers.length <= 6) {
      setTelefoneFormatado(`(${numbers.slice(0, 2)}) ${numbers.slice(2)}`);
    } else if (numbers.length <= 10) {
      setTelefoneFormatado(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`);
    } else {
      setTelefoneFormatado(`(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`);
    }
  };

  // Função para formatar CPF
  const handleCpfChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    setCpfLimpo(numbers);
    setCpf(numbers);

    if (numbers.length <= 3) {
      setCpfFormatado(numbers);
    } else if (numbers.length <= 6) {
      setCpfFormatado(`${numbers.slice(0, 3)}.${numbers.slice(3)}`);
    } else if (numbers.length <= 9) {
      setCpfFormatado(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`);
    } else {
      setCpfFormatado(`${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventos().finally(() => setRefreshing(false));
  };

  const usuarioJaInscrito = (eventoId: string) => {
    return inscricoes.some(ins => ins.eventoId === eventoId && ins.statusPagamento !== 'cancelada');
  };

  const formatarData = (data: any): string => {
    if (!data) return 'Data inválida';
    try {
      if (typeof data === 'object' && 'toDate' in data) {
        return data.toDate().toLocaleDateString('pt-BR');
      }
      if (data instanceof Date) {
        return data.toLocaleDateString('pt-BR');
      }
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString('pt-BR');
      }
      return 'Data inválida';
    } catch {
      return 'Data inválida';
    }
  };

  const handleCloseModal = () => {
    setModalInscricaoVisible(false);
    resetUserInfo();
  };

  // CORRIGIDO: Função para extrair valor em reais
  const extrairValorEmReais = (valorString: string): number => {
    const valorLimpo = valorString.replace('R$', '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(valorLimpo);
  };

  const handleInscrever = (evento: Evento) => {
    setEventoSelecionado(evento);
    resetUserInfo();
    setModalInscricaoVisible(true);
  };

  // CORRIGIDO: Função de polling única
  const startPaymentPolling = async (paymentId: string, inscricaoId?: string) => {
    // Limpar intervalo anterior se existir
    if (paymentInterval) {
      clearInterval(paymentInterval);
    }

    const interval = setInterval(async () => {
      try {
        const status = await getPaymentStatus(paymentId);
        setPaymentStatus(status);

        const paidStatuses = ['approved', 'completed', 'confirmed'];
        const failedStatuses = ['expired', 'cancelled', 'failed', 'rejected'];

        if (paidStatuses.includes(status)) {
          clearInterval(interval);
          setPaymentInterval(null);

          if (inscricaoId && eventoSelecionado?.id) {
            await updateInscricaoStatus(eventoSelecionado.id, inscricaoId, 'confirmada');
          }

          Alert.alert('Sucesso', 'Pagamento confirmado! Inscrição ativada.');
          setModalPixVisible(false);

          if (user) {
            await fetchInscricoes(user.uid);
          }
        } else if (failedStatuses.includes(status)) {
          clearInterval(interval);
          setPaymentInterval(null);
          Alert.alert('Pagamento Expirado', 'O PIX expirou. Por favor, gere um novo código.');
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    }, 10000);

    // Parar o polling após 30 minutos
    setTimeout(() => {
      clearInterval(interval);
      setPaymentInterval(null);
      if (paymentStatus !== 'approved') {
        Alert.alert('Tempo Esgotado', 'O tempo para pagamento expirou.');
      }
    }, 30 * 60 * 1000);

    setPaymentInterval(interval);
    return interval;
  };

  const handleConfirmarInscricao = async () => {
    if (eventoSelecionado && user) {
      try {
        const inscricao = await createInscricao({
          eventoId: eventoSelecionado.id,
          userId: user.uid,
          userName: nome,
          userEmail: email,
          telefone: telefone,
          cpf: cpf,
          statusPagamento: 'pendente',
          valor: eventoSelecionado.taxaInscricao,
          dataInscricao: new Date(),
          nomeEvento: eventoSelecionado.nomeSeminario
        });

        Alert.alert("Inscrição realizada com sucesso, com pagamento Pendente!");
        setInscricaoSelecionada(inscricao);
        setModalInscricaoVisible(false);
        resetUserInfo();

        if (user) {
          await fetchInscricoes(user.uid);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível realizar a inscrição');
      }
    }
  };

  const handleCancelarInscricao = async (inscricao: Inscricao) => {
    Alert.alert(
      'Cancelar Inscrição',
      'Tem certeza que deseja cancelar e remover sua inscrição?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              if (inscricao.id && inscricao.eventoId) {
                await cancelInscricao(inscricao.eventoId, inscricao.id);
                Alert.alert('Sucesso', 'Inscrição cancelada e removida com sucesso!');
                setModalAcompanhamentoVisible(false);

                if (user) {
                  await fetchInscricoes(user.uid);
                }
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar a inscrição');
            }
          }
        }
      ]
    );
  };

  const handleAcompanharInscricao = (evento: Evento) => {
    const inscricao = inscricoes.find(ins => ins.eventoId === evento.id);
    setInscricaoSelecionada(inscricao || null);
    setEventoSelecionado(evento);
    setModalAcompanhamentoVisible(true);
  };

  const handlePagarComPix = async () => {
    if (!telefone || !cpf) {
      Alert.alert('Dados incompletos', 'Por favor, preencha telefone e CPF para realizar o pagamento');
      return;
    }

    if (telefone.length < 10) {
      Alert.alert('Telefone inválido', 'Digite um telefone com DDD válido');
      return;
    }

    if (cpf.length !== 11) {
      Alert.alert('CPF inválido', 'Digite um CPF com 11 dígitos');
      return;
    }

    setLoadingPix(true);

    try {
      const valorEmReais = extrairValorEmReais(eventoSelecionado?.taxaInscricao || '0');

      if (isNaN(valorEmReais) || valorEmReais <= 0) {
        throw new Error('Valor de inscrição inválido');
      }

      if (valorEmReais < 1) {
        Alert.alert(
          'Valor insuficiente', `O valor mínimo para pagamento é R$ 1,00.\nValor atual: ${eventoSelecionado?.taxaInscricao}`,);
        setLoadingPix(false);
        return;
      }

      const pixRequest: CreatePixPaymentRequest = {
        transaction_amount: valorEmReais,
        description: `Inscrição: ${eventoSelecionado?.nomeSeminario || 'Evento'}`.substring(0, 250),
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: nome.split(' ')[0]?.substring(0, 50) || 'Cliente',
          last_name: nome.split(' ').slice(1).join(' ').substring(0, 50) || 'Anônimo',
          identification: {
            type: 'CPF',
            number: cpf.replace(/\D/g, ''),
          },
        },
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      const payment = await createPixPayment(pixRequest);
      setPixPayment(payment);
      setPaymentStatus(payment.status);
      setModalPixVisible(true);

      startPaymentPolling(payment.id, inscricaoSelecionada?.id);

    } catch (error: any) {
      console.error('❌ Erro no pagamento PIX:', error);
      let errorMessage = 'Não foi possível gerar o PIX';

      if (error.message.includes('401')) {
        errorMessage = 'Erro de autenticação. Verifique as credenciais do Mercado Pago.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Dados inválidos. Verifique as informações fornecidas.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }

      Alert.alert('Erro no Pagamento', errorMessage);
    } finally {
      setLoadingPix(false);
    }
  };

  const handleSharePix = async () => {
    if (!pixPayment) {
      Alert.alert('Erro', 'Pagamento PIX não disponível');
      return;
    }

    const pixCode = pixPayment.point_of_interaction.transaction_data.qr_code;

    try {
      await Share.share({
        message: `PIX Copia e Cola: ${pixCode}\nValor: R$ ${pixPayment.transaction_amount.toFixed(2)}`,
        title: 'Código PIX para pagamento'
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o código PIX');
    }
  };

  // Modal de Inscrição
  const renderModalInscricao = () => (
    <Modal
      visible={modalInscricaoVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalInscricaoVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirmar Inscrição</Text>
          <Text style={styles.eventoModalTitle}>{eventoSelecionado?.nomeSeminario}</Text>

          <View style={styles.modalDetail}>
            <Text style={styles.modalLabel}>Data:</Text>
            <Text style={styles.modalValue}>
              {eventoSelecionado && new Date(eventoSelecionado.dtEvento).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          <View style={styles.modalDetail}>
            <Text style={styles.modalLabel}>Local:</Text>
            <Text style={styles.modalValue}>{eventoSelecionado?.endereco}</Text>
          </View>

          <View style={styles.modalDetail}>
            <Text style={styles.modalLabel}>Valor:</Text>
            <Text style={styles.modalValue}>{eventoSelecionado?.taxaInscricao}</Text>
          </View>

          <TextInput
            style={[styles.input, !telefoneLimpo && styles.inputError]}
            placeholder="Seu telefone com DDD *"
            value={telefoneFormatado}
            onChangeText={handleTelefoneChange}
            keyboardType="phone-pad"
            maxLength={15}
          />

          <TextInput
            style={[styles.input, !cpfLimpo && styles.inputError]}
            placeholder="Seu CPF *"
            value={cpfFormatado}
            onChangeText={handleCpfChange}
            keyboardType="numeric"
            maxLength={14}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleCloseModal}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleConfirmarInscricao}
            >
              <Text style={styles.modalButtonTextPrimary}>Confirmar Inscrição</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de Pagamento PIX
  const renderModalPix = () => {
    if (!pixPayment) return null;

    return (
      <Modal
        visible={modalPixVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalPixVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPix}>
            <Text style={styles.modalTitle}>Pagamento PIX - Mercado Pago</Text>

            <View style={styles.pixContainer}>
              <Text style={styles.pixAmount}>
                Valor: R$ {pixPayment.transaction_amount.toFixed(2)}
              </Text>

              <Text style={styles.pixInstructions}>
                Escaneie o QR Code abaixo ou use o código PIX para pagar:
              </Text>

              <View style={styles.qrCodeContainer}>
                {pixPayment.point_of_interaction.transaction_data.qr_code_base64 ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${pixPayment.point_of_interaction.transaction_data.qr_code_base64}` }}
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                  />
                ) : (
                  <QRCode
                    value={pixPayment.point_of_interaction.transaction_data.qr_code}
                    size={200}
                    color={theme.colors.text}
                    backgroundColor="white"
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={async () => {
                  await Clipboard.setStringAsync(pixPayment.point_of_interaction.transaction_data.qr_code);
                  Alert.alert('Copiado', 'Código PIX copiado para a área de transferência!');
                }}
              >
                <MaterialIcons name="content-copy" size={18} color="#fff" />
                <Text style={styles.copyButtonText}>Copiar Código PIX</Text>
              </TouchableOpacity>

              <Text style={[
                styles.pixStatus,
                paymentStatus === 'approved' ? styles.pixStatusApproved :
                  paymentStatus === 'pending' ? styles.pixStatusPending :
                    styles.pixStatusExpired
              ]}>
                Status: {paymentStatus.toUpperCase()}
              </Text>

              <Text style={styles.pixExpiry}>
                Expira em: {new Date(pixPayment.date_of_expiration).toLocaleString('pt-BR')}
              </Text>

              <TouchableOpacity
                style={styles.viewPaymentButton}
                onPress={() => Linking.openURL(pixPayment.point_of_interaction.transaction_data.ticket_url)}
              >
                <Text style={styles.viewPaymentButtonText}>Visualizar comprovante</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalPixVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Fechar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSharePix}
              >
                <MaterialIcons name="share" size={18} color="#fff" />
                <Text style={styles.modalButtonTextPrimary}>Compartilhar</Text>
              </TouchableOpacity>
            </View>

            {loadingPix && (
              <View style={styles.loadingPixContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.pixLoadingText}>Processando pagamento...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Modal de Acompanhamento
  const renderModalAcompanhamento = () => (
    <Modal
      visible={modalAcompanhamentoVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalAcompanhamentoVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Acompanhar Inscrição</Text>
            <Text style={styles.eventoModalTitle}>{eventoSelecionado?.nomeSeminario}</Text>

            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusText,
                {
                  color: inscricaoSelecionada?.statusPagamento === 'confirmada'
                    ? theme.colors.otherColor
                    : theme.colors.warning
                }
              ]}>
                Status: {inscricaoSelecionada?.statusPagamento?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.inscricaoDetails}>
              <Text style={styles.detailLabel}>Data da Inscrição:</Text>
              <Text style={styles.detailValue}>
                {formatarData(inscricaoSelecionada?.dataInscricao)}
              </Text>

              <Text style={styles.detailLabel}>Valor:</Text>
              <Text style={styles.detailValue}>{inscricaoSelecionada?.valor}</Text>

              <Text style={styles.detailLabel}>Nome:</Text>
              <Text style={styles.detailValue}>{inscricaoSelecionada?.userName}</Text>

              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{inscricaoSelecionada?.userEmail}</Text>
            </View>

            {inscricaoSelecionada?.statusPagamento === 'pendente' && (
              <>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPix]}
                  onPress={() => {
                    setModalAcompanhamentoVisible(false);
                    handlePagarComPix();
                  }}
                >
                  <MaterialIcons name="pix" size={18} color="#fff" />
                  <Text style={styles.modalButtonTextPrimary}>Pagar com PIX</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDanger]}
                  onPress={() => handleCancelarInscricao(inscricaoSelecionada)}
                >
                  <Text style={styles.modalButtonTextPrimary}>Cancelar Inscrição</Text>
                  <MaterialIcons name="cancel" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {inscricaoSelecionada?.statusPagamento !== 'pendente' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalAcompanhamentoVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Fechar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Eventos Disponíveis</Text>
            <Text style={styles.headerSubtitle}>Inscreva-se nos próximos eventos ativos:</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  activeCategory === category && styles.activeCategoryButton
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  activeCategory === category && styles.activeCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.eventsCountContainer}>
            <Text style={styles.eventsCountText}>
              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento ativo' : 'eventos ativos'}
            </Text>
          </View>

          <View style={styles.eventsContainer}>
            {filteredEvents.map((evento) => (
              <View key={evento.id} style={styles.card}>
                <Image
                  source={fotoDM}
                  style={styles.cardImage}
                  resizeMode="cover"
                />

                <View style={styles.cardContent}>
                  <View style={styles.statusBadge}>
                    <MaterialIcons
                      name="check-circle"
                      size={14}
                      color={theme.colors.otherColor}
                    />
                    <Text style={styles.statusBadgeText}>ATIVO</Text>
                  </View>

                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{evento.taxaInscricao}</Text>
                  </View>

                  <Text style={styles.cardTitle}>{evento.nomeSeminario}</Text>

                  <View style={styles.detailItem}>
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color={theme.colors.secondary}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText}>{evento.endereco}</Text>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="date-range"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>
                        {new Date(evento.dtEvento).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="access-time"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>{'14:00 - 17:00'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="people"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>
                        {evento.vagas} vagas disponíveis
                      </Text>
                    </View>
                  </View>

                  {usuarioJaInscrito(evento.id) ? (
                    <TouchableOpacity
                      style={styles.acompanharButton}
                      onPress={() => handleAcompanharInscricao(evento)}
                    >
                      <Text style={styles.acompanharButtonText}>Acompanhar Inscrição</Text>
                      <MaterialIcons name="visibility" size={18} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={() => handleInscrever(evento)}
                    >
                      <Text style={styles.registerButtonText}>Inscrever-se</Text>
                      <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {filteredEvents.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="event-busy"
                size={48}
                color={theme.colors.secondary}
              />
              <Text style={styles.emptyText}>
                {eventos.length === 0
                  ? 'Nenhum evento cadastrado'
                  : 'Nenhum evento ativo no momento'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {renderModalInscricao()}
        {renderModalAcompanhamento()}
        {renderModalPix()}
      </LinearGradient>
    </ScreenContainer>
  );
};


const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContentPix: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
    fontFamily: 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.secondary,
    fontWeight: '500',
    lineHeight: 22,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  eventsCountContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  eventsCountText: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  eventsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  statusBadgeText: {
    color: theme.colors.otherColor,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTag: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryTagText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  accessButton: {
    backgroundColor: theme.colors.otherColor,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },

  // Novos estilos para os modais e botões
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  eventoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalValue: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonDanger: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  acompanharButtonCancelada: {
    backgroundColor: '#6c757d',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  acompanharButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  acompanharButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // Estilos PIX
  pixContainer: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  pixAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pixInstructions: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pixStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pixCodeContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  pixCodeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: theme.colors.text,
    textAlign: 'center',
  },
  pixLoadingText: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pixErrorText: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingPixContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  inscricaoDetails: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 12,
  },

  // Adicionar este estilo para o botão PIX:
  modalButtonPix: {
    backgroundColor: '#32BCAD', // Cor verde do PIX
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },

  // Estilos para o botão debug
  debugButton: {
    backgroundColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    margin: 10,
    alignSelf: 'center',
    gap: 8
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },

  qrCodeImage: {
    width: 200,
    height: 200,
  },
  pixExpiry: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 8,
  },

  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff0f0',
  },

  viewPaymentButton: {
    marginTop: 10,
    padding: 10,
  },
  viewPaymentButtonText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },

  // pixStatus: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   marginVertical: 10,
  //   textAlign: 'center',
  // },
  pixStatusApproved: {
    color: 'green',
  },
  pixStatusPending: {
    color: 'orange',
  },
  pixStatusExpired: {
    color: 'red',
  },

});