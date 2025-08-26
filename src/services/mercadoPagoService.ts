import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const MERCADO_PAGO_ACCESS_TOKEN = Constants.expoConfig?.extra?.mercadoPagoAccessToken;
const MERCADO_PAGO_PUBLIC_KEY = Constants.expoConfig?.extra?.mercadoPagoPublicKey;
const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

export interface MercadoPagoPixPayment {
    id: string;
    status: string;
    point_of_interaction: {
        transaction_data: {
            qr_code: string;
            qr_code_base64: string;
            ticket_url: string;
        };
    };
    transaction_amount: number;
    date_of_expiration: string;
}

export interface CreatePixPaymentRequest {
    transaction_amount: number;
    description: string;
    payment_method_id: 'pix';
    payer: {
        email: string;
        first_name?: string;
        last_name?: string;
        identification?: {
            type: 'CPF' | 'CNPJ';
            number: string;
        };
    };
    date_of_expiration?: string;
}

export const isMercadoPagoConfigured = (): boolean => {
    return !!(MERCADO_PAGO_ACCESS_TOKEN && MERCADO_PAGO_PUBLIC_KEY);
};

// Gerar uma chave de idempotência única
const generateIdempotencyKey = async (): Promise<string> => {
    try {
        // Tenta gerar uma chave única usando crypto
        const randomBytes = await Crypto.getRandomBytes(32);
        const key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return `mp_${key}_${Date.now()}`;
    } catch (error) {
        // Fallback: usa timestamp + random se crypto falhar
        return `mp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
};

// Armazenar e recuperar chaves de idempotência para evitar duplicatas
const IDEMPOTENCY_STORE_KEY = 'mercado_pago_idempotency_keys';

const storeIdempotencyKey = async (key: string): Promise<void> => {
    try {
        const existingKeys = await SecureStore.getItemAsync(IDEMPOTENCY_STORE_KEY);
        const keys = existingKeys ? JSON.parse(existingKeys) : [];

        // Mantém apenas as últimas 100 chaves para evitar storage excessivo
        const updatedKeys = [...keys, key].slice(-100);

        await SecureStore.setItemAsync(IDEMPOTENCY_STORE_KEY, JSON.stringify(updatedKeys));
    } catch (error) {
        console.warn('Erro ao armazenar chave de idempotência:', error);
    }
};

const isIdempotencyKeyUsed = async (key: string): Promise<boolean> => {
    try {
        const existingKeys = await SecureStore.getItemAsync(IDEMPOTENCY_STORE_KEY);
        const keys = existingKeys ? JSON.parse(existingKeys) : [];
        return keys.includes(key);
    } catch (error) {
        console.warn('Erro ao verificar chave de idempotência:', error);
        return false;
    }
};

export const createPixPayment = async (request: CreatePixPaymentRequest): Promise<MercadoPagoPixPayment> => {
    try {
        if (!MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('Access Token do Mercado Pago não configurado');
        }

        // Gera uma chave de idempotência única
        const idempotencyKey = await generateIdempotencyKey();

        // Verifica se a chave já foi usada (evita duplicatas)
        if (await isIdempotencyKeyUsed(idempotencyKey)) {
            // Se já foi usada, gera uma nova
            return createPixPayment(request);
        }

        // Armazena a chave para evitar reuso
        await storeIdempotencyKey(idempotencyKey);

        const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey, // HEADER OBRIGATÓRIO
            },
            body: JSON.stringify({
                ...request,
                date_of_expiration: request.date_of_expiration || new Date(Date.now() + 3600 * 1000).toISOString(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro detalhado do Mercado Pago:', errorData);

            let errorMessage = `Erro HTTP ${response.status}`;
            if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.cause && Array.isArray(errorData.cause)) {
                errorMessage = errorData.cause.map((c: any) => c.description).join(', ');
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        throw error;
    }
};

export const getPaymentStatus = async (paymentId: string): Promise<string> => {
    try {
        const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const paymentData = await response.json();
        return paymentData.status;
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        throw error;
    }
};

// Função alternativa para verificar status (usando v1)
export const checkPaymentStatusAlternative = async (paymentId: string): Promise<string> => {
    try {
        const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const paymentData = await response.json();
        return paymentData.status;
    } catch (error) {
        console.error('Erro ao verificar status do pagamento (alternativo):', error);
        throw error;
    }
};