// src/screens/EventoScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Switch,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Modal,
    TouchableWithoutFeedback,
    FlatList,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialIcons } from '@expo/vector-icons';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    where,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';

import { ScreenContainer } from '../components/ScreenContainer';
import { useEventosStore, Evento } from '../zustand/EventsStore';
import { theme } from '../theme';

// Configurar localização em português
LocaleConfig.locales['pt-br'] = {
    monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthNamesShort: [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ],
    dayNames: [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

export function EventoScreen() {
    const navigation = useNavigation();
    const { createEvento, loading } = useEventosStore();
    const insets = useSafeAreaInsets();

    const [nomeSeminario, setNomeSeminario] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [endereco, setEndereco] = useState('');
    const [userNomeScretarioAbriu, setUserNomeScretarioAbriu] = useState('');
    const [vagas, setVagas] = useState('0');
    const [taxaInscricao, setTaxaInscricao] = useState('');
    const [status, setStatus] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);


    // Novos estados para a listagem
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [modalCadastroVisible, setModalCadastroVisible] = useState(false);
    const [modalEdicaoVisible, setModalEdicaoVisible] = useState(false);
    const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
    const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'encerrados'>('ativos');

    // Carregar eventos em tempo real com filtro
    useEffect(() => {
        let q;
        if (filtroAtivo === 'todos') {
            q = query(collection(db, 'eventos'), orderBy('dtEvento', 'desc'));
        } else if (filtroAtivo === 'ativos') {
            q = query(
                collection(db, 'eventos'),
                where('status', '==', true),
                orderBy('dtEvento', 'desc')
            );
        } else {
            q = query(
                collection(db, 'eventos'),
                where('status', '==', false),
                orderBy('dtEvento', 'desc')
            );
        }

        const unsub = onSnapshot(q, snap =>
            setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Evento)))
        );
        return () => unsub();
    }, [filtroAtivo]);

    const formatDateTime = () => {
        if (!selectedDate) return '';

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return selectedTime ? `${dateStr}T${selectedTime}` : dateStr;
    };

    const handleDateSelect = (day: any) => {
        // Usar a string da data diretamente para evitar problemas de fuso horário
        const [year, month, dayNum] = day.dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayNum));
        setSelectedDate(date);
        setShowCalendar(false);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setShowTimePicker(false);
    };

    const limparCampos = () => {
        setNomeSeminario('');
        setSelectedDate(null);
        setSelectedTime('');
        setEndereco('');
        setUserNomeScretarioAbriu('');
        setVagas('0');
        setTaxaInscricao('');
        setStatus(false);
        setEventoEditando(null);
    };

    const fecharModalCadastro = () => {
        setModalCadastroVisible(false);
        limparCampos();
    };

    const fecharModalEdicao = () => {
        setModalEdicaoVisible(false);
        limparCampos();
    };

    const abrirModalCadastro = () => {
        limparCampos();
        setModalCadastroVisible(true);
    };

    const abrirModalEdicao = (evento: Evento) => {
        setEventoEditando(evento);

        // Preencher os campos com os dados do evento
        setNomeSeminario(evento.nomeSeminario);

        // Parse da data e hora
        const [datePart, timePart] = evento.dtEvento.split('T');
        if (datePart) {
            const [year, month, day] = datePart.split('-');
            setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
        if (timePart) {
            setSelectedTime(timePart);
        }

        setEndereco(evento.endereco);
        setUserNomeScretarioAbriu(evento.userNomeScretarioAbriu);
        setVagas(evento.vagas.toString());
        setTaxaInscricao(evento.taxaInscricao);
        setStatus(evento.status);

        setModalEdicaoVisible(true);
    };

    const handleSave = async () => {
        const dtEvento = formatDateTime();

        if (
            !nomeSeminario.trim() ||
            !dtEvento.trim() ||
            !endereco.trim() ||
            !taxaInscricao.trim() ||
            !userNomeScretarioAbriu.trim()
        ) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }

        try {
            await createEvento({
                nomeSeminario: nomeSeminario.trim(),
                dtEvento: dtEvento.trim(),
                endereco: endereco.trim(),
                userNomeScretarioAbriu: userNomeScretarioAbriu.trim(),
                vagas: parseInt(vagas, 10),
                taxaInscricao: taxaInscricao.trim(),
                status: true, // Sempre cria como ativo
            } as Omit<Evento, 'id'>);

            Alert.alert('Sucesso', 'Evento criado com sucesso!');
            fecharModalCadastro();
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível criar o evento.');
        }
    };

    const handleEdit = async () => {
        if (!eventoEditando) return;

        const dtEvento = formatDateTime();

        if (
            !nomeSeminario.trim() ||
            !dtEvento.trim() ||
            !endereco.trim() ||
            !taxaInscricao.trim() ||
            !userNomeScretarioAbriu.trim()
        ) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }

        try {
            await updateDoc(doc(db, 'eventos', eventoEditando.id), {
                nomeSeminario: nomeSeminario.trim(),
                dtEvento: dtEvento.trim(),
                endereco: endereco.trim(),
                userNomeScretarioAbriu: userNomeScretarioAbriu.trim(),
                vagas: parseInt(vagas, 10),
                taxaInscricao: taxaInscricao.trim(),
                status: status,
            });

            Alert.alert('Sucesso', 'Evento atualizado com sucesso!');
            fecharModalEdicao();
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível atualizar o evento.');
        }
    };

    //Status do Evento
    const toggleStatusEvento = async (evento: Evento) => {
        try {
            await updateDoc(doc(db, 'eventos', evento.id), {
                status: !evento.status
            });
            Alert.alert('Sucesso', `Evento ${!evento.status ? 'ativado' : 'desativado'}!`);
        } catch {
            Alert.alert('Erro', 'Não foi possível alterar o status do evento.');
        }
    };

    const excluirEvento = (id: string) => {
        Alert.alert('Confirmação', 'Excluir este evento?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'eventos', id));
                        Alert.alert('Excluído', 'Evento removido com sucesso!');
                    } catch {
                        Alert.alert('Erro', 'Não foi possível excluir o evento.');
                    }
                },
            },
        ]);
    };

    const formatarDataExibicao = (dataString: string) => {
        try {
            const [datePart, timePart] = dataString.split('T');
            const [year, month, day] = datePart.split('-');
            return `${day}/${month}/${year} ${timePart || ''}`;
        } catch {
            return dataString;
        }
    };

    const renderCalendarModal = () => (
        <Modal
            visible={showCalendar}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCalendar(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={handleDateSelect}
                                markedDates={{
                                    [selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '']: {
                                        selected: true,
                                        selectedColor: theme.colors.primary
                                    }
                                }}
                                theme={{
                                    todayTextColor: theme.colors.primary,
                                    arrowColor: theme.colors.primary,
                                    selectedDayBackgroundColor: theme.colors.primary,
                                    selectedDayTextColor: '#ffffff',
                                }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const renderTimePickerModal = () => (
        <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.timePickerContainer}>
                            <Text style={styles.timePickerTitle}>Selecione o horário</Text>
                            <ScrollView style={styles.timeList}>
                                {Array.from({ length: 24 }, (_, i) => {
                                    const hour = i.toString().padStart(2, '0');
                                    return ['00', '15', '30', '45'].map(minute => {
                                        const time = `${hour}:${minute}`;
                                        return (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeOption,
                                                    selectedTime === time && styles.timeOptionSelected
                                                ]}
                                                onPress={() => handleTimeSelect(time)}
                                            >
                                                <Text style={[
                                                    styles.timeOptionText,
                                                    selectedTime === time && styles.timeOptionTextSelected
                                                ]}>
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    });
                                }).flat()}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const renderModalCadastro = () => (
        <Modal
            visible={modalCadastroVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={fecharModalCadastro}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <Text style={styles.modalTitle}>Novo Evento</Text>

                        {/* Campos do formulário */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Nome do Seminário *</Text>
                            <TextInput
                                style={styles.input}
                                value={nomeSeminario}
                                onChangeText={setNomeSeminario}
                                placeholder="Digite o nome"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Data e Hora */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Data e Hora *</Text>

                            <TouchableOpacity
                                style={styles.dateTimeButton}
                                onPress={() => setShowCalendar(true)}
                            >
                                <Text style={styles.dateTimeButtonText}>
                                    {selectedDate
                                        ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                        : 'Selecionar data'
                                    }
                                </Text>
                            </TouchableOpacity>

                            {selectedDate && (
                                <TouchableOpacity
                                    style={[styles.dateTimeButton, styles.timeButton]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.dateTimeButtonText}>
                                        {selectedTime || 'Selecionar horário'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {selectedDate && selectedTime && (
                                <Text style={styles.selectedDateTime}>
                                    Data selecionada: {formatDateTime()}
                                </Text>
                            )}
                        </View>

                        {/* Endereço */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Endereço *</Text>
                            <TextInput
                                style={styles.input}
                                value={endereco}
                                onChangeText={setEndereco}
                                placeholder="Rua, número, bairro"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Secretário */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Secretário *</Text>
                            <TextInput
                                style={styles.input}
                                value={userNomeScretarioAbriu}
                                onChangeText={setUserNomeScretarioAbriu}
                                placeholder="Nome do secretário"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Vagas */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Vagas *</Text>
                            <TextInput
                                style={styles.input}
                                value={vagas}
                                onChangeText={setVagas}
                                placeholder="0"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Taxa de Inscrição */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Taxa de Inscrição *</Text>
                            <TextInput
                                style={styles.input}
                                value={taxaInscricao}
                                onChangeText={(text) => {
                                    const cleanText = text.replace(/\D/g, '');
                                    const number = parseInt(cleanText, 10) / 100;
                                    if (isNaN(number)) {
                                        setTaxaInscricao('');
                                    } else {
                                        setTaxaInscricao(number.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }));
                                    }
                                }}
                                placeholder="R$ 0,00"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.modalButton]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.background} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Salvar Evento</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, styles.modalButton]}
                                onPress={fecharModalCadastro}
                            >
                                <Text style={styles.secondaryButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderModalEdicao = () => (
        <Modal
            visible={modalEdicaoVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={fecharModalEdicao}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <Text style={styles.modalTitle}>Editar Evento</Text>

                        {/* Campos do formulário */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Nome do Seminário *</Text>
                            <TextInput
                                style={styles.input}
                                value={nomeSeminario}
                                onChangeText={setNomeSeminario}
                                placeholder="Digite o nome"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Data e Hora */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Data e Hora *</Text>

                            <TouchableOpacity
                                style={styles.dateTimeButton}
                                onPress={() => setShowCalendar(true)}
                            >
                                <Text style={styles.dateTimeButtonText}>
                                    {selectedDate
                                        ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                        : 'Selecionar data'
                                    }
                                </Text>
                            </TouchableOpacity>

                            {selectedDate && (
                                <TouchableOpacity
                                    style={[styles.dateTimeButton, styles.timeButton]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.dateTimeButtonText}>
                                        {selectedTime || 'Selecionar horário'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {selectedDate && selectedTime && (
                                <Text style={styles.selectedDateTime}>
                                    Data selecionada: {formatDateTime()}
                                </Text>
                            )}
                        </View>

                        {/* Endereço */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Endereço *</Text>
                            <TextInput
                                style={styles.input}
                                value={endereco}
                                onChangeText={setEndereco}
                                placeholder="Rua, número, bairro"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Secretário */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Secretário *</Text>
                            <TextInput
                                style={styles.input}
                                value={userNomeScretarioAbriu}
                                onChangeText={setUserNomeScretarioAbriu}
                                placeholder="Nome do secretário"
                                placeholderTextColor={theme.colors.placeholder}
                            />
                        </View>

                        {/* Vagas */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Vagas *</Text>
                            <TextInput
                                style={styles.input}
                                value={vagas}
                                onChangeText={setVagas}
                                placeholder="0"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Taxa de Inscrição */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Taxa de Inscrição *</Text>
                            <TextInput
                                style={styles.input}
                                value={taxaInscricao}
                                onChangeText={(text) => {
                                    const cleanText = text.replace(/\D/g, '');
                                    const number = parseInt(cleanText, 10) / 100;
                                    if (isNaN(number)) {
                                        setTaxaInscricao('');
                                    } else {
                                        setTaxaInscricao(number.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }));
                                    }
                                }}
                                placeholder="R$ 0,00"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Status (apenas na edição) */}
                        <View style={[styles.field, styles.switchField]}>
                            <Text style={styles.label}>Evento Ativo</Text>
                            <Switch
                                value={status}
                                onValueChange={setStatus}
                                thumbColor={status ? theme.colors.primary : '#f4f3f4'}
                                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.modalButton]}
                                onPress={handleEdit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.background} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Atualizar Evento</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, styles.modalButton]}
                                onPress={fecharModalEdicao}
                            >
                                <Text style={styles.secondaryButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Header do FlatList com filtros
    const renderHeader = () => (
        <View>
            {/* Header */}
            <View style={styles.header}>
                <MaterialIcons
                    name="event"
                    size={28}
                    color={theme.colors.primary}
                    style={styles.headerIcon}
                />
                <Text style={styles.headerTitle}>Eventos</Text>
            </View>

            {/* Botão para novo evento */}
            <TouchableOpacity
                style={styles.novoEventoButton}
                onPress={abrirModalCadastro}
            >
                <MaterialIcons
                    name="add"
                    size={20}
                    color={theme.colors.background}
                    style={styles.buttonIcon}
                />
                <Text style={styles.novoEventoButtonText}>Novo Evento</Text>
            </TouchableOpacity>

            {/* Filtros */}
            <View style={styles.filtrosContainer}>
                <Text style={styles.filtroLabel}>Mostrar:</Text>
                <View style={styles.filtrosButtons}>
                    <TouchableOpacity
                        style={[
                            styles.filtroButton,
                            filtroAtivo === 'ativos' && styles.filtroButtonActive
                        ]}
                        onPress={() => setFiltroAtivo('ativos')}
                    >
                        <Text style={[
                            styles.filtroButtonText,
                            filtroAtivo === 'ativos' && styles.filtroButtonTextActive
                        ]}>
                            Ativos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filtroButton,
                            filtroAtivo === 'encerrados' && styles.filtroButtonActive
                        ]}
                        onPress={() => setFiltroAtivo('encerrados')}
                    >
                        <Text style={[
                            styles.filtroButtonText,
                            filtroAtivo === 'encerrados' && styles.filtroButtonTextActive
                        ]}>
                            Encerrados
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filtroButton,
                            filtroAtivo === 'todos' && styles.filtroButtonActive
                        ]}
                        onPress={() => setFiltroAtivo('todos')}
                    >
                        <Text style={[
                            styles.filtroButtonText,
                            filtroAtivo === 'todos' && styles.filtroButtonTextActive
                        ]}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Título da lista */}
            <View style={styles.subtitleContainer}>
                <MaterialIcons
                    name="list"
                    size={20}
                    color={theme.colors.text}
                    style={styles.subtitleIcon}
                />
                <Text style={styles.subtitle}>
                    {filtroAtivo === 'ativos' && 'Eventos Ativos'}
                    {filtroAtivo === 'encerrados' && 'Eventos Encerrados'}
                    {filtroAtivo === 'todos' && 'Todos os Eventos'}
                </Text>
            </View>
        </View>
    );

    return (
        <ScreenContainer>
            <LinearGradient
                colors={['#FFFFFF', '#F8F9FF']}
                style={[
                    styles.gradientContainer,
                    { paddingTop: insets.top, paddingBottom: insets.bottom },
                ]}
            >
                <FlatList
                    contentContainerStyle={styles.container}
                    data={eventos}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={renderHeader}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons
                                    name={item.status ? "event-available" : "event-busy"}
                                    size={20}
                                    color={item.status ? theme.colors.primary : theme.colors.error}
                                />
                                <Text style={styles.cardTitle}>{item.nomeSeminario}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: item.status ? theme.colors.otherColor : theme.colors.error }
                                    ]}>
                                        {item.status ? 'ATIVO' : 'ENCERRADO'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardHeader}>
                                <MaterialIcons name="emoji-people" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardTitle}>Inscritos até o momento: {"120"}</Text>
                            </View>

                            <View style={styles.cardDetail}>
                                <MaterialIcons name="calendar-today" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardText}>
                                    {formatarDataExibicao(item.dtEvento)}
                                </Text>
                            </View>

                            <View style={styles.cardDetail}>
                                <MaterialIcons name="location-on" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardText}>{item.endereco}</Text>
                            </View>

                            <View style={styles.cardDetail}>
                                <MaterialIcons name="person" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardText}>Secretário: {item.userNomeScretarioAbriu}</Text>
                            </View>

                            <View style={styles.cardDetail}>
                                <MaterialIcons name="people" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardText}>Vagas: {item.vagas}</Text>
                            </View>

                            <View style={styles.cardDetail}>
                                <MaterialIcons name="attach-money" size={14} color={theme.colors.secondary} />
                                <Text style={styles.cardText}>Taxa: {item.taxaInscricao}</Text>
                            </View>

                            <View style={styles.actions}>
                                {/* Botão de editar - apenas para eventos ativos */}
                                {item.status && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.editarButton]}
                                        onPress={() => abrirModalEdicao(item)}
                                    >
                                        <MaterialIcons
                                            name="edit"
                                            size={18}
                                            color={theme.colors.background}
                                        />
                                        <Text style={styles.actionButtonText}>Editar</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        item.status ? styles.encerrarButton : styles.reativarButton
                                    ]}
                                    onPress={() => toggleStatusEvento(item)}
                                >
                                    <MaterialIcons
                                        name={item.status ? "pause-circle" : "play-circle"}
                                        size={18}
                                        color={theme.colors.background}
                                    />
                                    <Text style={styles.actionButtonText}>
                                        {item.status ? 'Encerrar' : 'Reativar'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Botão de excluir - apenas para eventos ativos */}
                                {item.status && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.excluirButton]}
                                        onPress={() => excluirEvento(item.id)}
                                    >
                                        <MaterialIcons
                                            name="delete"
                                            size={18}
                                            color={theme.colors.background}
                                        />
                                        <Text style={styles.actionButtonText}>Excluir</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListFooterComponent={<View style={styles.footer} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons
                                name="event-busy"
                                size={48}
                                color={theme.colors.secondary}
                            />
                            <Text style={styles.emptyText}>
                                {filtroAtivo === 'ativos' && 'Nenhum evento ativo'}
                                {filtroAtivo === 'encerrados' && 'Nenhum evento encerrado'}
                                {filtroAtivo === 'todos' && 'Nenhum evento cadastrado'}
                            </Text>
                        </View>
                    }
                />

                {renderModalCadastro()}
                {renderModalEdicao()}
                {renderCalendarModal()}
                {renderTimePickerModal()}
            </LinearGradient>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    switchField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editarButton: {
        backgroundColor: theme.colors.otherColor,
    },
    // Novos estilos para filtros
    filtrosContainer: {
        marginBottom: theme.spacing.large,
    },
    filtroLabel: {
        ...theme.textVariants.body,
        color: theme.colors.text,
        marginBottom: theme.spacing.small,
        textAlign: 'center',
    },
    filtrosButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.small,
    },
    filtroButton: {
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        borderRadius: theme.radius.medium,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filtroButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filtroButtonText: {
        ...theme.textVariants.body,
        color: theme.colors.text,
    },
    filtroButtonTextActive: {
        color: theme.colors.background,
        fontWeight: '600',
    },

    // Estilos para status
    statusBadge: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.small,
        paddingVertical: 4,
        borderRadius: theme.radius.small,
        borderWidth: 1,
    },
    statusText: {
        ...theme.textVariants.body,
        fontWeight: 'bold',
        fontSize: 10,
    },



    // Estilo para lista vazia
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xlarge,
    },
    emptyText: {
        ...theme.textVariants.body,
        color: theme.colors.secondary,
        textAlign: 'center',
        marginTop: theme.spacing.medium,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing.small,
        gap: theme.spacing.small,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.medium,
        paddingVertical: theme.spacing.small,
        borderRadius: theme.radius.medium,
        borderWidth: 1,
        minWidth: 100,
        justifyContent: 'center',
        gap: theme.spacing.small / 2,
    },
    encerrarButton: {
        backgroundColor: "black",
    },
    reativarButton: {
        backgroundColor: theme.colors.otherColor,
        borderColor: theme.colors.otherColor,
    },
    excluirButton: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },
    actionButtonText: {
        ...theme.textVariants.body,
        color: theme.colors.background,
        fontWeight: '600',
        fontSize: 14,
    },

    // Adicionar novos styles
    container: {
        paddingHorizontal: theme.spacing.large,
        paddingTop: theme.spacing.large,
        paddingBottom: theme.spacing.xlarge,
    },
    footer: {
        height: theme.spacing.xlarge,
    },

    // Manter todos os outros styles...
    gradientContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.large,
        gap: theme.spacing.small,
    },
    headerIcon: {
        marginRight: theme.spacing.small,
    },
    headerTitle: {
        ...theme.textVariants.title,
        color: theme.colors.text,
        fontWeight: '700',
    },
    novoEventoButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.medium,
        borderRadius: theme.radius.medium,
        alignItems: 'center',
        marginBottom: theme.spacing.xlarge,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.small,
    },
    buttonIcon: {
        marginRight: theme.spacing.small,
    },
    novoEventoButtonText: {
        ...theme.textVariants.button,
        color: theme.colors.background,
        fontWeight: '600',
    },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.medium,
        gap: theme.spacing.small,
    },
    subtitleIcon: {
        marginRight: theme.spacing.small,
    },
    subtitle: {
        ...theme.textVariants.subtitle,
        color: theme.colors.text,
        textAlign: 'center',
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.small,
        gap: theme.spacing.small,
    },
    cardTitle: {
        ...theme.textVariants.button,
        color: theme.colors.text,
        flex: 1,
    },
    cardDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.small,
        marginBottom: theme.spacing.small,
    },
    cardText: {
        ...theme.textVariants.body,
        color: theme.colors.secondary,
        flex: 1,
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
    field: {
        marginBottom: theme.spacing.medium,
    },
    label: {
        ...theme.textVariants.body,
        color: theme.colors.text,
        marginBottom: theme.spacing.small,
    },
    input: {
        height: 48,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.medium,
        paddingHorizontal: theme.spacing.medium,
        fontSize: theme.textVariants.body.fontSize,
        color: theme.colors.text,
    },
    dateTimeButton: {
        height: 48,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.medium,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.medium,
        marginBottom: theme.spacing.small,
    },
    timeButton: {
        marginBottom: 0,
    },
    dateTimeButtonText: {
        fontSize: theme.textVariants.body.fontSize,
        color: theme.colors.text,
    },
    selectedDateTime: {
        marginTop: theme.spacing.small,
        fontSize: 12,
        color: theme.colors.secondary,
        fontStyle: 'italic',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: theme.spacing.medium,
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
    disabledButton: {
        backgroundColor: theme.colors.disabled,
    },
    // Estilos para o calendário
    calendarContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.large,
        padding: theme.spacing.medium,
        width: '90%',
        maxWidth: 400,
    },

    // Estilos para o seletor de tempo
    timePickerContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.large,
        padding: theme.spacing.large,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    timePickerTitle: {
        ...theme.textVariants.subtitle,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.medium,
    },
    timeList: {
        maxHeight: 300,
    },
    timeOption: {
        padding: theme.spacing.medium,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    timeOptionSelected: {
        backgroundColor: theme.colors.primary + '20',
    },
    timeOptionText: {
        ...theme.textVariants.body,
        color: theme.colors.text,
        textAlign: 'center',
    },
    timeOptionTextSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
});