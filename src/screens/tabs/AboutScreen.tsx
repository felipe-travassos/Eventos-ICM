import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../theme';


export const AboutScreen = () => {
  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Sobre o Aplicativo Eventos ICM</Text>
          <Text style={styles.text}>
            Este aplicativo foi desenvolvido para facilitar o gerenciamento de inscrições em eventos.
          </Text>

          <Text style={styles.sectionTitle}>Informações</Text>
          <Text style={styles.text}>
            Versão: 1.0.0{'\n'}
            Desenvolvedor: Felipe Travassos{'\n'}
            Contato: ftravassos.icm@gmail.com
          </Text>

          <Text style={styles.sectionTitle}>Copyright</Text>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60, // Espaço para o header
    paddingBottom: 20,
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...theme.textVariants.title,
    marginBottom: theme.spacing.large,
    textAlign: 'center',
  },
  sectionTitle: {
    ...theme.textVariants.title,
    fontSize: 18,
    marginTop: theme.spacing.xlarge,
    marginBottom: theme.spacing.small,
  },
  text: {
    ...theme.textVariants.body,
    marginBottom: theme.spacing.small,
    lineHeight: 24,
  },
  copyright: {
    ...theme.textVariants.body,
    marginTop: theme.spacing.xlarge,
    textAlign: 'center',
    color: theme.colors.secondary,
  },
});