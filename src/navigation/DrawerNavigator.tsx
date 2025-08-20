// src/navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabNavigator } from './TabNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CustomDrawerContent } from './CustomDrawerContent';
import { theme } from '../theme';

export type DrawerParamList = {
  Tabs: undefined;
  Settings: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

// Componente do botão flutuante
function DrawerToggleButton({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={[styles.fab, { top: insets.top + 10, left: 16 }]}
      activeOpacity={0.7}
    >
      <MaterialIcons name="menu" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Tabs"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTransparent: true,       // Header overlay para o botão “flutuar”
        headerTitle: '',               // Remove título padrão
        headerLeft: () => (
          <DrawerToggleButton navigation={navigation} />
        ),
        swipeEnabled: true,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 240,
        },
      })}
    >
      <Drawer.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ title: 'Início' }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,                  // sombra no Android
    shadowColor: '#000',           // sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});