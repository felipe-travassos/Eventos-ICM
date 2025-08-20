import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { theme } from '../theme';

export const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Erro', 'Por favor, informe seu email');
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Email enviado',
                'Verifique sua caixa de entrada para redefinir sua senha',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/logo1.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.overlay} />

                    <View style={styles.content}>
                        <View style={styles.logoContainer}>
                            <MaterialIcons
                                name="lock-reset"
                                size={60}
                                color="#fff"
                            />
                        </View>

                        <Text style={styles.title}>Redefinir Senha</Text>
                        <Text style={styles.subtitle}>
                            Informe seu email para receber o link de redefinição
                        </Text>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons
                                    name="email"
                                    size={20}
                                    color={theme.colors.lightText}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite seu email"
                                    placeholderTextColor={theme.colors.lightText}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoCorrect={false}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>Enviar Link</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <MaterialIcons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.backButtonText}>Voltar para Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        ...theme.textVariants.title,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        ...theme.textVariants.subtitle,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.radius.large,
        padding: theme.spacing.large,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: theme.radius.medium,
        paddingHorizontal: theme.spacing.medium,
        marginBottom: theme.spacing.large,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    inputIcon: {
        marginRight: theme.spacing.small,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#fff',
        paddingVertical: 0,
    },
    button: {
        height: 50,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.medium,
        marginBottom: theme.spacing.medium,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    buttonText: {
        color: '#fff',
        ...theme.textVariants.button,
    },
    backButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.medium,
    },
    backButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: 'bold',
    },
});