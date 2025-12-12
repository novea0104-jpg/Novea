import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  consumePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  type Product,
  type Purchase,
  type PurchaseError,
  ErrorCode,
} from 'react-native-iap';
import { supabase } from './supabase';

export const NOVOIN_PRODUCTS = [
  'novoin_10',
  'novoin_25',
  'novoin_50',
  'novoin_100',
  'novoin_250',
  'novoin_500',
] as const;

export type NovoinProductId = typeof NOVOIN_PRODUCTS[number];

export const PRODUCT_COIN_MAP: Record<NovoinProductId, { coins: number; bonus: number }> = {
  novoin_10: { coins: 10, bonus: 0 },
  novoin_25: { coins: 25, bonus: 2 },
  novoin_50: { coins: 50, bonus: 5 },
  novoin_100: { coins: 100, bonus: 15 },
  novoin_250: { coins: 250, bonus: 50 },
  novoin_500: { coins: 500, bonus: 125 },
};

let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSubscription: { remove: () => void } | null = null;
let isInitialized = false;
let storedUserId: string | null = null;
let currentPurchaseCallback: {
  productId: NovoinProductId;
  userId: string;
  onSuccess: (totalCoins: number) => void;
  onError: (error: string) => void;
} | null = null;

export async function initializeBilling(userId?: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('Google Play Billing only available on Android');
    return false;
  }

  if (userId) {
    storedUserId = userId;
  }

  if (isInitialized) {
    return true;
  }

  try {
    await initConnection();
    
    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('Purchase updated:', purchase);
      await handlePurchaseUpdate(purchase);
    });

    purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.error('Purchase error:', error);
      
      if (currentPurchaseCallback && error.code !== ErrorCode.UserCancelled) {
        currentPurchaseCallback.onError(error.message || 'Pembelian gagal');
      }
      currentPurchaseCallback = null;
    });

    isInitialized = true;
    console.log('Google Play Billing initialized');
    
    await processPendingPurchases();
    
    return true;
  } catch (error) {
    console.error('Error initializing billing:', error);
    return false;
  }
}

async function processPendingPurchases(): Promise<void> {
  if (!storedUserId) {
    console.log('No user ID stored, skipping pending purchase processing');
    return;
  }

  try {
    const purchases = await getAvailablePurchases();
    
    for (const purchase of purchases) {
      const productId = purchase.productId as NovoinProductId;
      if (PRODUCT_COIN_MAP[productId]) {
        console.log('Processing pending purchase:', productId);
        await handlePurchaseUpdate(purchase);
      }
    }
  } catch (error) {
    console.error('Error processing pending purchases:', error);
  }
}

async function handlePurchaseUpdate(purchase: Purchase) {
  const productId = purchase.productId as NovoinProductId;
  
  if (!PRODUCT_COIN_MAP[productId]) {
    console.error('Unknown product:', productId);
    return;
  }

  const purchaseState = (purchase as any).purchaseState;
  if (purchaseState && purchaseState !== 'purchased') {
    console.log('Purchase not completed yet, state:', purchaseState);
    return;
  }

  const callback = currentPurchaseCallback;
  const userId = callback?.userId || storedUserId;
  
  if (!userId) {
    console.log('No user ID available, cannot process purchase');
    return;
  }

  try {
    const result = await validatePurchaseServerSide(
      parseInt(userId),
      productId,
      purchase.purchaseToken || '',
      purchase.transactionId || ''
    );
    
    if (result.success && result.totalCoins > 0) {
      if (purchase.purchaseToken) {
        await consumePurchaseAndroid(purchase.purchaseToken);
      }
      await finishTransaction({ purchase, isConsumable: true });
      
      if (callback && callback.productId === productId) {
        callback.onSuccess(result.totalCoins);
        currentPurchaseCallback = null;
      }
    } else if (result.success && result.totalCoins === 0) {
      if (purchase.purchaseToken) {
        await consumePurchaseAndroid(purchase.purchaseToken);
      }
      await finishTransaction({ purchase, isConsumable: true });
      console.log('Purchase already processed:', purchase.transactionId);
      if (callback && callback.productId === productId) {
        currentPurchaseCallback = null;
      }
    } else {
      if (callback && callback.productId === productId) {
        callback.onError(result.error || 'Validasi pembelian gagal');
        currentPurchaseCallback = null;
      }
    }
  } catch (err: any) {
    console.error('Error processing purchase:', err);
    if (callback && callback.productId === productId) {
      callback.onError(err.message || 'Gagal memproses pembelian');
      currentPurchaseCallback = null;
    }
  }
}

interface ValidateResult {
  success: boolean;
  totalCoins: number;
  newBalance?: number;
  error?: string;
  message?: string;
}

async function validatePurchaseServerSide(
  userId: number,
  productId: string,
  purchaseToken: string,
  transactionId: string
): Promise<ValidateResult> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-purchase', {
      body: {
        userId,
        productId,
        purchaseToken,
        transactionId,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, totalCoins: 0, error: error.message };
    }

    return data as ValidateResult;
  } catch (error: any) {
    console.error('Error calling validate-purchase:', error);
    return { success: false, totalCoins: 0, error: error.message || 'Server validation failed' };
  }
}

export async function getAvailableProducts(): Promise<Product[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const products = await fetchProducts({
      skus: [...NOVOIN_PRODUCTS],
      type: 'in-app',
    });
    return (products as Product[]) || [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function purchaseProduct(
  productId: NovoinProductId,
  userId: string,
  onSuccess: (totalCoins: number) => void,
  onError: (error: string) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    onError('Pembelian hanya tersedia di Android');
    return;
  }

  if (!isInitialized) {
    onError('Layanan pembayaran belum siap');
    return;
  }

  currentPurchaseCallback = { productId, userId, onSuccess, onError };

  try {
    await requestPurchase({
      request: {
        android: {
          skus: [productId],
        },
      },
      type: 'in-app',
    });
  } catch (error: any) {
    console.error('Error requesting purchase:', error);
    currentPurchaseCallback = null;
    onError(error.message || 'Gagal memulai pembelian');
  }
}

export async function endBillingConnection(): Promise<void> {
  currentPurchaseCallback = null;
  
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  
  if (isInitialized) {
    try {
      await endConnection();
      isInitialized = false;
    } catch (error) {
      console.error('Error ending billing connection:', error);
    }
  }
}

export function isGooglePlayAvailable(): boolean {
  return Platform.OS === 'android';
}

export function setStoredUserId(userId: string): void {
  storedUserId = userId;
}
