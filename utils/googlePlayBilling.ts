import { Platform, Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  consumePurchaseAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
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

export async function initializeBilling(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('Google Play Billing only available on Android');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    await initConnection();
    isInitialized = true;
    console.log('Google Play Billing initialized');
    return true;
  } catch (error) {
    console.error('Error initializing billing:', error);
    return false;
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

  try {
    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('Purchase updated:', purchase);
      
      if (purchase.productId === productId) {
        try {
          const validated = await validateAndProcessPurchase(purchase, userId);
          
          if (validated) {
            if (purchase.purchaseToken) {
              await consumePurchaseAndroid(purchase.purchaseToken);
            }
            await finishTransaction({ purchase, isConsumable: true });
            
            const coinInfo = PRODUCT_COIN_MAP[productId];
            const totalCoins = coinInfo.coins + coinInfo.bonus;
            onSuccess(totalCoins);
          } else {
            onError('Validasi pembelian gagal');
          }
        } catch (err) {
          console.error('Error processing purchase:', err);
          onError('Gagal memproses pembelian');
        }
      }
      
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
        purchaseUpdateSubscription = null;
      }
    });

    purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.error('Purchase error:', error);
      
      if (error.code !== ErrorCode.UserCancelled) {
        onError(error.message || 'Pembelian gagal');
      }
      
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
        purchaseErrorSubscription = null;
      }
    });

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
    onError(error.message || 'Gagal memulai pembelian');
    
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
  }
}

async function validateAndProcessPurchase(purchase: Purchase, userId: string): Promise<boolean> {
  try {
    const productId = purchase.productId as NovoinProductId;
    const coinInfo = PRODUCT_COIN_MAP[productId];
    
    if (!coinInfo) {
      console.error('Unknown product:', productId);
      return false;
    }

    const totalCoins = coinInfo.coins + coinInfo.bonus;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('coin_balance')
      .eq('id', parseInt(userId))
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return false;
    }

    const newBalance = user.coin_balance + totalCoins;

    const { error: updateError } = await supabase
      .from('users')
      .update({ coin_balance: newBalance })
      .eq('id', parseInt(userId));

    if (updateError) {
      console.error('Error updating coin balance:', updateError);
      return false;
    }

    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: parseInt(userId),
        type: 'purchase',
        amount: totalCoins,
        description: `Pembelian ${totalCoins} Novoin via Google Play`,
        reference_id: purchase.transactionId || purchase.purchaseToken,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    return true;
  } catch (error) {
    console.error('Error validating purchase:', error);
    return false;
  }
}

export async function endBillingConnection(): Promise<void> {
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
