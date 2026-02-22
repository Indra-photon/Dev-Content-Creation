
import { PRODUCTS } from '@/lib/paymentConfig';

export const PRICING_CARDS = [
    {
        key: 'ebook_guide',
        title: 'Resume Guide',
        description: 'The ultimate guide to crafting the perfect resume.',
        price: '$19',
        features: ['PDF Download', 'Lifetime Access', 'Templates Included'],
        cta: 'Buy Now',
        popular: false,
        type: 'one_time'
    },
    {
        key: 'premium_monthly',
        title: 'Pro Monthly',
        description: 'Perfect for job seekers who need tools now.',
        price: '$10',
        period: '/month',
        features: ['Unlimited Resumes', 'AI Analysis', 'Priority Support'],
        cta: 'Subscribe',
        popular: true,
        type: 'subscription'
    },
    {
        key: 'premium_annual',
        title: 'Pro Annual',
        description: 'Best value for long-term career growth.',
        price: '$100',
        period: '/year',
        features: ['Everything in Monthly', '2 Months Free', 'Career Coaching Session'],
        cta: 'Subscribe',
        popular: false,
        type: 'subscription'
    }
];
