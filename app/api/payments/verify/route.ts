
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import PaymentModel from '@/app/api/models/PaymentModel'
import UserModel from '@/app/api/models/UserModel'
import { getProductByKey } from '@/lib/paymentConfig'
import DodoPayments from 'dodopayments' // If verification requires SDK check
import { PAYMENT_CONFIG } from '@/lib/paymentConfig'

export async function POST(request: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { session_id, product_key } = await request.json()

        if (!session_id || !product_key) {
            return NextResponse.json(
                { error: 'Missing session_id or product_key' },
                { status: 400 }
            )
        }

        await dbConnect()

        // 1. Check if we already recorded this payment
        const existingPayment = await PaymentModel.findOne({ provider_id: session_id })
        if (existingPayment) {
            return NextResponse.json({
                success: true,
                status: existingPayment.status,
                message: 'Payment already recorded'
            })
        }

        // 2. Verify with Dodo API (Optional: strict check)
        // You can call `client.checkoutSessions.retrieve(session_id)` to be 100% sure of status
        // For this template, we'll assume the simple flow for now, but adding SDK check is better
        const client = new DodoPayments({
            bearerToken: PAYMENT_CONFIG.apiKey,
            environment: PAYMENT_CONFIG.environment as 'test_mode' | 'live_mode'
        })

        const session = await client.checkoutSessions.retrieve(session_id)

        if (session.payment_status !== 'succeeded') {
            return NextResponse.json(
                { error: 'Payment not completed yet' },
                { status: 400 }
            )
        }

        if (!session.payment_id) {
            return NextResponse.json(
                { error: 'Payment ID missing from session' },
                { status: 500 }
            )
        }

        // 3. Fetch Full Payment Details to get amount, currency, etc.
        const payment = await client.payments.retrieve(session.payment_id)

        const product = getProductByKey(product_key)

        // 4. Create Payment Record
        const newPayment = await PaymentModel.create({
            user_id: userId,
            amount: payment.total_amount || product?.price || 0,
            currency: payment.currency || product?.currency || 'USD',
            status: 'succeeded',
            type: product?.type || 'one_time',
            product_id: product_key, // Storing key for easier reference
            provider_id: session_id,
            metadata: {
                customer_email: payment.customer?.email || session.customer_email,
                dodo_product_id: product?.id,
                payment_id: payment.payment_id
            }
        })

        // 4. Update User Access (Generic Logic)
        // This is where you'd give credits, enable premium, etc.
        // For specific app logic, you modify this part.
        // Example: await UserModel.updateOne({ clerk_id: userId }, { $set: { is_premium: true } })

        return NextResponse.json({
            success: true,
            verified: true,
            payment: newPayment
        })

    } catch (error) {
        console.error('Payment verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        )
    }
}
