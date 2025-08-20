import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
    DrawerContentScrollView, DrawerItemList,
} from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/auth';
import { theme } from '../theme';

export function CustomDrawerContent(props: any) {
    const { user } = useAuth();
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        // fallback para provedor
        const uri = user.photoURL || user.providerData[0]?.photoURL || null;
        setAvatarUri(uri);
        setLoading(false);
    }, [user]);

    const handleLogout = async () => {
        await logout();
        props.navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarWrapper}>
                    {loading && (
                        <ActivityIndicator color="#fff" style={StyleSheet.absoluteFill} />
                    )}
                    <Image
                        source={
                            avatarUri
                                ? { uri: avatarUri }
                                : require('../../assets/avatar-placeholder.png')
                        }
                        style={styles.avatar}
                        onError={() => setAvatarUri(null)}
                    />
                </View>
                <Text style={styles.name}>{user?.displayName}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
                <DrawerItemList {...props} />
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color={theme.colors.error} />
                    <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>

                <Text style={styles.copy}>
                    © {new Date().getFullYear()} Felipe Travassos. Todos os direitos reservados.
                </Text>
            </View>
        </View>
    );
}

const AVATAR_SIZE = 64;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 30,
        alignItems: 'center',
    },
    avatarWrapper: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    name: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    email: {
        color: '#f0f0f0',
        fontSize: 14,
    },
    scroll: { paddingTop: 0 },
    footer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: 60,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    logoutText: {
        color: theme.colors.error,
        fontSize: 16,
        marginLeft: 8,
    },
    copy: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: 12,
        marginTop: 12,
    },
});