
export const PAYMENT_CONFIG = {
    apiKey: process.env.DODO_PAYMENTS_API_KEY!,
    environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
} as const;

// Define your products here
export const PRODUCTS = {
    // Subscriptions
    premium_monthly: {
        id: process.env.DODO_PRODUCT_ID_MONTHLY!,
        name: 'Premium Monthly',
        price: 1000, // in cents
        currency: 'USD',
        type: 'subscription'
    },
    premium_annual: {
        id: process.env.DODO_PRODUCT_ID_ANNUAL!,
        name: 'Premium Annual',
        price: 10000,
        currency: 'USD',
        type: 'subscription'
    },

    // One-time Products
    ebook_guide: {
        id: process.env.DODO_PRODUCT_ID_EBOOK!,
        name: 'Ultimate Resume Guide',
        price: 1900,
        currency: 'USD',
        type: 'one_time'
    }
} as const;

export type ProductKey = keyof typeof PRODUCTS;

export function getProductByKey(key: string) {
    return PRODUCTS[key as ProductKey];
}
