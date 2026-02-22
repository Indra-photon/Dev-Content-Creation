
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { PRICING_CARDS } from '@/constants/pricing';

export default function PricingSection() {

    const handleCheckout = async (productKey: string) => {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productKey })
            });

            if (response.status === 401) {
                toast.error('Please sign in to continue');
                window.location.href = '/sign-in';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to start checkout');
                return;
            }

            window.location.href = data.checkout_url;
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Something went wrong. Please try again.');
        }
    };

    return (
        <section className="py-24 bg-background">
            <div className="container px-4 md:px-6">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                        Choose the plan or product that's right for you. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PRICING_CARDS.map((card, index) => (
                        <motion.div
                            key={card.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card className={`h-full flex flex-col ${card.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {card.title}
                                        {card.popular && (
                                            <span className="px-3 py-1 text-xs text-primary-foreground bg-primary rounded-full">
                                                Popular
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>{card.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{card.price}</span>
                                        {card.period && <span className="text-muted-foreground">{card.period}</span>}
                                    </div>
                                    <ul className="space-y-2">
                                        {card.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-primary" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={card.popular ? 'default' : 'outline'}
                                        onClick={() => handleCheckout(card.key)}
                                    >
                                        {card.cta}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
