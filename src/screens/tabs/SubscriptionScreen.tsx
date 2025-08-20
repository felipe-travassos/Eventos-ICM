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
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useStore } from '../../zustand/store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');

export const SubscriptionScreen = () => {
  const { eventos, fetchEventos, loading } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Pega os insets do dispositivo (notch, barras)
  const insets = useSafeAreaInsets();

  const categories = ['Todos', 'Seminários', 'Cultos'];

  // filtra eventos para exibir
  const filteredEvents = activeCategory === 'Todos'
    ? eventos
    : eventos.filter(evento => evento.tipoEvento === activeCategory);


  useEffect(() => {
    fetchEventos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventos().finally(() => setRefreshing(false));
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom }
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FF']}
        style={[
          styles.gradientContainer,
          {
            paddingTop: insets.top,      // respeita área superior
            paddingBottom: insets.bottom // respeita área inferior
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

          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Eventos Disponíveis</Text>
            <Text style={styles.headerSubtitle}>Inscreva-se nos melhores eventos da sua área</Text>
          </View>

          {/* Category Filters */}
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

          {/* Events Count */}
          <View style={styles.eventsCountContainer}>
          <Text style={styles.eventsCountText}>
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento disponível' : 'eventos disponíveis'}
          </Text>
        </View>

          {/* Events List */}
          <View style={styles.eventsContainer}>
            {filteredEvents.map((evento) => (
              <View key={evento.id} style={styles.card}>
                {/* Event Image */}
                <Image
                  source={{ uri: 'https://www.igrejacristamaranata.org.br/wp-content/uploads/2024/12/imagem-2024-12-03-094439136.png' }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />

                {/* Event Content */}
                <View style={styles.cardContent}>
                  {/* Category Tag */}
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{evento.tipoEvento}</Text>
                  </View>

                  {/* Event Title */}
                  <Text style={styles.cardTitle}>{evento.nomeSeminario}</Text>

                  {/* Event Location */}
                  <View style={styles.detailItem}>
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color={theme.colors.secondary}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.cardDescription}>{evento.endereco}</Text>
                  </View>

                  {/* Event Details */}
                  <View style={styles.detailsContainer}>
                    {/* Date */}
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

                    {/* Time */}
                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="access-time"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>{'14:00 - 17:00'}</Text>
                    </View>

                    {/* Vacancies */}
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

                  {/* Register Button */}
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => console.log('Inscrição no evento:', evento.id)}
                  >
                    <Text style={styles.registerButtonText}>Inscrever-se</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  gradientContainer: {
    flex: 1,
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
  cardDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 16,
    lineHeight: 20,
    marginLeft: 24, // Align with icon
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
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});