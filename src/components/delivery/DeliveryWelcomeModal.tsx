import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import tshirtImage from '@/assets/tshirt.png';

interface DeliveryWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export function DeliveryWelcomeModal({ isOpen, onClose, userName }: DeliveryWelcomeModalProps) {
    const [timeLeft, setTimeLeft] = useState(10);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Reset timer when modal opens
        setTimeLeft(10);
        setCanClose(false);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanClose(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        disabled={!canClose}
                        className={`absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 transition-colors ${canClose ? 'hover:bg-black/20 text-foreground cursor-pointer' : 'text-foreground/50 cursor-not-allowed'
                            }`}
                    >
                        {canClose ? <X className="w-5 h-5" /> : <span className="text-sm font-bold">{timeLeft}</span>}
                    </button>

                    {/* Header Image Area */}
                    <div className="relative h-96 bg-gradient-to-br from-primary/20 to-primary/5 px-2 pt-2 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/40 mask-image-linear-bottom"></div>
                        <motion.img
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            src={tshirtImage}
                            alt="QuickEats Delivery T-Shirt"
                            className="w-full h-full object-contain relative z-10 drop-shadow-2xl rounded-t-xl"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="p-8 text-center bg-card">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Welcome to QuickEats, {userName}! 🎉
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                We're excited to have you on board as delivering partner.
                                Complete your first 10 deliveries to receive your official QuickEats delivery t-shirt!
                            </p>

                            <Button
                                onClick={onClose}
                                disabled={!canClose}
                                className="w-full shadow-lg hover:shadow-primary/25 h-12 text-lg font-medium"
                            >
                                {canClose ? "Let's Get Started!" : `Please wait ${timeLeft}s`}
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
