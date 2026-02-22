# Generic Payment Gateway Implementation (Dodo Payments)

This project includes a **universal payment system** designed to handle both **Subscriptions** (SaaS) and **One-Time Products** (E-commerce).

## 1. Setup

### Environment Variables
Add these to your `.env.local`:

```bash
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Product IDs from Dodo Dashboard
DODO_PRODUCT_ID_MONTHLY=prod_monthly_123
DODO_PRODUCT_ID_ANNUAL=prod_annual_123
DODO_PRODUCT_ID_EBOOK=prod_ebook
```

### Configuration
Edit `lib/paymentConfig.ts` to define your products:

```typescript
export const PRODUCTS = {
  premium_monthly: {
    id: process.env.DODO_PRODUCT_ID_MONTHLY!,
    name: 'Premium Monthly',
    price: 1000, 
    type: 'subscription' 
  },
  ebook: {
    id: process.env.DODO_PRODUCT_ID_EBOOK!,
    name: 'E-Book',
    price: 1900,
    type: 'one_time'
  }
}
```

## 2. How it Works

### Database Models
- **`PaymentModel.ts`**: Records every successful transaction.
    - `type`: Stores `'subscription'` or `'one_time'`.
    - `status`: `'succeeded'`, `'pending'`, etc.
    - `provider_id`: The session ID from Dodo.

### API Routes
- **`POST /api/checkout`**: Creates a checkout session.
    - Body: `{ productKey: 'ebook', quantity: 1 }`
- **`POST /api/payments/verify`**: Verifies payment after redirect.
    - Body: `{ session_id: '...', product_key: '...' }`

## 3. Usage in Frontend

Use the helper function or simply call the API to start a checkout:

```typescript
const handleCheckout = async (productKey: string) => {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ productKey })
  });
  const { checkout_url } = await res.json();
  window.location.href = checkout_url;
}
```

## 4. Expanding
To add a new product (e.g., "Consulting Call"):
1. Add the ID to `.env.local`.
2. Add the entry to `PRODUCTS` in `lib/paymentConfig.ts`.
3. Add a card to `constants/pricing.ts` (if using the UI).
