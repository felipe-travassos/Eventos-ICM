// src/services/abacatePay.ts
import Constants from 'expo-constants';

export interface PixPaymentRequest {
    amount: number;
    expiresIn: number;
    description: string;
    customer: {
        name: string;
        cellphone: string;
        email: string;
        taxId: string;
        externalId?: string;
    };
    metadata?: {
        [key: string]: any;
    };
}

export interface PixPaymentResponse {
    data: {
        id: string;
        amount: number;
        status: string;
        devMode: boolean;
        brCode: string;
        brCodeBase64: string;
        platformFee: number;
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
    };
    error: any;
}

export interface PixPayment {
    id: string;
    amount: number;
    status: string;
    brCode: string;
    qrCodeText: string;
    qrCodeBase64: string;
    expiresAt: string;
    createdAt: string;
}

// Verificar se a API está configurada
export const isAbacatePayConfigured = (): boolean => {
    const apiKey = Constants.expoConfig?.extra?.abacatepayApiKey;
    const apiUrl = Constants.expoConfig?.extra?.abacatepayApiUrl;
    return !!(apiKey && apiUrl);
};

// Obter a URL base da API
const getApiBaseUrl = (): string => {
    return Constants.expoConfig?.extra?.abacatepayApiUrl || 'https://api.abacatepay.com.br/v1';
};

// Obter o token de autenticação
const getApiToken = (): string => {
    return Constants.expoConfig?.extra?.abacatepayApiKey || '';
};

// Criar pagamento PIX
export const createPixPayment = async (request: PixPaymentRequest): Promise<PixPayment> => {
    try {
        const apiUrl = getApiBaseUrl();
        const token = getApiToken();

        console.log('🔗 Enviando requisição para:', `${apiUrl}/pixQrCode/create`);
        console.log('📦 Dados da requisição:', JSON.stringify(request, null, 2));
        console.log('🔑 Token API:', token ? 'Presente' : 'Ausente');

        // Adicione timeout à requisição
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

        const response = await fetch(`${apiUrl}/pixQrCode/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'myapp://', // Para apps Expo
                'User-Agent': 'MyApp/1.0.0', // User-Agent personalizado
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📊 Status da resposta:', response.status);
        console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📄 Corpo da resposta:', responseText);

        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage += ` - ${JSON.stringify(errorData)}`;
            } catch (e) {
                errorMessage += ` - ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        let data: PixPaymentResponse;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Resposta JSON inválida: ${responseText}`);
        }

        if (data.error) {
            throw new Error(data.error.message || 'Erro na API AbacatePay');
        }

        if (!data.data) {
            throw new Error('Resposta da API sem dados');
        }

        console.log('✅ Resposta da API:', data);

        return {
            id: data.data.id,
            amount: data.data.amount,
            status: data.data.status,
            brCode: data.data.brCode,
            qrCodeText: data.data.brCode,
            qrCodeBase64: data.data.brCodeBase64,
            expiresAt: data.data.expiresAt,
            createdAt: data.data.createdAt,
        };

    } catch (error: any) {
        console.error('❌ Erro detalhado ao criar pagamento PIX:', error);

        if (error.name === 'AbortError') {
            throw new Error('Timeout: A requisição demorou muito para responder');
        }

        if (error.message.includes('Network request failed')) {
            throw new Error('Falha de rede: Verifique sua conexão com a internet');
        }

        if (error.message.includes('Failed to fetch')) {
            throw new Error('Não foi possível conectar ao servidor');
        }

        throw error;
    }
};

// Verificar status do pagamento
export const getPaymentStatus = async (paymentId: string): Promise<string> => {
    try {
        const apiUrl = getApiBaseUrl();
        const token = getApiToken();

        const response = await fetch(`${apiUrl}/pixQrCode/status/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data?.status || 'unknown';

    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        throw error;
    }
};

// Método alternativo para verificar status (fallback)
export const checkPaymentStatusAlternative = async (paymentId: string): Promise<string> => {
    try {
        // Tentar método principal primeiro
        return await getPaymentStatus(paymentId);
    } catch (error) {
        console.warn('Método principal falhou, usando fallback');
        // Simular status pendente como fallback
        return 'pending';
    }
};

// Debug das configurações
export const debugClientMethods = () => {
    console.log('🔧 Debug AbacatePay:');
    console.log('API URL:', getApiBaseUrl());
    console.log('API Token:', getApiToken() ? '✅ Configurado' : '❌ Não configurado');
    console.log('Configurado:', isAbacatePayConfigured());
};