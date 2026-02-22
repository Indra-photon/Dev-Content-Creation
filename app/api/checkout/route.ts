
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import dbConnect from '@/lib/dbConnect'
import UserModel from '@/app/api/models/UserModel'
import PaymentModel from '@/app/api/models/PaymentModel'
import { PAYMENT_CONFIG, getProductByKey } from '@/lib/paymentConfig'

export async function POST(request: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { productKey, quantity = 1 } = await request.json()
        const product = getProductByKey(productKey)

        if (!productKey || !product) {
            return NextResponse.json(
                { error: 'Invalid product' },
                { status: 400 }
            )
        }

        await dbConnect()

        // Ensure user exists locally
        let user = await UserModel.findOne({ clerk_id: userId })
        if (!user) {
            // You might want to fetch email from Clerk here if not stored
            // For now, returning error or you can create a placeholder
            return NextResponse.json(
                { error: 'User record not found. Please sign in correctly.' },
                { status: 404 }
            )
        }

        const client = new DodoPayments({
            bearerToken: PAYMENT_CONFIG.apiKey,
            environment: PAYMENT_CONFIG.environment as 'test_mode' | 'live_mode'
        })

        const session = await client.checkoutSessions.create({
            product_cart: [{
                product_id: product.id,
                quantity: quantity
            }],
            customer: {
                email: user.email,
                name: user.name || 'Valued Customer'
            },
            return_url: `${PAYMENT_CONFIG.baseUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}&product_key=${productKey}`
        })

        return NextResponse.json({
            success: true,
            checkout_url: session.checkout_url,
            session_id: session.session_id
        })

    } catch (error) {
        console.error('Checkout session creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
