import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

import { theme } from '../../theme';

export const CompletedScreen = () => {
  return (
    <>
      <View style={styles.content}>
        <Text style={styles.title}>Eventos Realizados</Text>
        {/* Conteúdo da tela */}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.large,
    marginTop: 50, // Espaço para o header
  },
  title: {
    ...theme.textVariants.title,
    marginBottom: theme.spacing.medium,
  },
});