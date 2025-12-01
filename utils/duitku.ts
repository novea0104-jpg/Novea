import * as Crypto from 'expo-crypto';

const DUITKU_SANDBOX_URL = 'https://sandbox.duitku.com/webapi/api/merchant';
const DUITKU_PRODUCTION_URL = 'https://passport.duitku.com/webapi/api/merchant';

const IS_SANDBOX = process.env.EXPO_PUBLIC_DUITKU_SANDBOX !== 'false';
const BASE_URL = IS_SANDBOX ? DUITKU_SANDBOX_URL : DUITKU_PRODUCTION_URL;

const MERCHANT_CODE = process.env.EXPO_PUBLIC_DUITKU_MERCHANT_CODE || '';
const API_KEY = process.env.EXPO_PUBLIC_DUITKU_API_KEY || '';

export interface PaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: string;
}

export interface CreatePaymentRequest {
  merchantOrderId: string;
  productDetails: string;
  amount: number;
  email: string;
  customerName: string;
  callbackUrl: string;
  returnUrl: string;
  paymentMethod: string;
}

export interface CreatePaymentResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  qrString?: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

export interface TransactionStatus {
  merchantOrderId: string;
  reference: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

async function generateMD5(input: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    input
  );
  return digest;
}

function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function getPaymentMethods(amount: number): Promise<PaymentMethod[]> {
  try {
    const datetime = getCurrentDateTime();
    const signature = await generateMD5(MERCHANT_CODE + amount.toString() + datetime + API_KEY);

    const response = await fetch(`${BASE_URL}/paymentmethod/getpaymentmethod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantcode: MERCHANT_CODE,
        amount: amount.toString(),
        datetime: datetime,
        signature: signature,
      }),
    });

    const data = await response.json();
    
    if (data.paymentFee) {
      return data.paymentFee;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
}

export async function createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse | null> {
  try {
    const signature = await generateMD5(
      MERCHANT_CODE + request.merchantOrderId + request.amount.toString() + API_KEY
    );

    const response = await fetch(`${BASE_URL}/v2/inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantCode: MERCHANT_CODE,
        paymentAmount: request.amount,
        paymentMethod: request.paymentMethod,
        merchantOrderId: request.merchantOrderId,
        productDetails: request.productDetails,
        customerVaName: request.customerName,
        email: request.email,
        callbackUrl: request.callbackUrl,
        returnUrl: request.returnUrl,
        signature: signature,
        expiryPeriod: 60,
      }),
    });

    const data = await response.json();
    
    if (data.statusCode === '00') {
      return data;
    }
    
    console.error('Payment creation failed:', data);
    return null;
  } catch (error) {
    console.error('Error creating payment:', error);
    return null;
  }
}

export async function checkTransactionStatus(merchantOrderId: string): Promise<TransactionStatus | null> {
  try {
    const signature = await generateMD5(MERCHANT_CODE + merchantOrderId + API_KEY);

    const response = await fetch(`${BASE_URL}/transactionStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantCode: MERCHANT_CODE,
        merchantOrderId: merchantOrderId,
        signature: signature,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return null;
  }
}

export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NOVEA-${timestamp}-${random}`;
}

export const PAYMENT_METHODS = {
  QRIS: 'SP',
  VA_BCA: 'BC',
  VA_MANDIRI: 'M1',
  VA_BNI: 'I1',
  VA_BRI: 'BR',
  VA_PERMATA: 'BT',
  VA_CIMB: 'B1',
  OVO: 'OV',
  DANA: 'DA',
  SHOPEEPAY: 'SA',
  LINKAJA: 'LA',
};

export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  SP: 'QRIS (Semua E-Wallet)',
  BC: 'Virtual Account BCA',
  M1: 'Virtual Account Mandiri',
  I1: 'Virtual Account BNI',
  BR: 'Virtual Account BRI',
  BT: 'Virtual Account Permata',
  B1: 'Virtual Account CIMB Niaga',
  OV: 'OVO',
  DA: 'DANA',
  SA: 'ShopeePay',
  LA: 'LinkAja',
};
