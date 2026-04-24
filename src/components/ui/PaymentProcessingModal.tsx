import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface PaymentProcessingModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'idle' | 'processing' | 'success' | 'error';
    amount: string;
    payoutId?: string;
    errorMessage?: string;
    type?: 'withdrawal' | 'add';
}

export const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
    isOpen,
    onClose,
    status,
    amount,
    payoutId,
    errorMessage,
    type = 'withdrawal'
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && status !== 'processing' && onClose()}>
            <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0 flex items-center justify-center pointer-events-none">
                <DialogTitle className="sr-only">{type === 'withdrawal' ? 'Processing Withdrawal' : 'Processing Payment'}</DialogTitle>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto">
                    <AnimatePresence mode="wait">
                        {status === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-8 flex flex-col items-center text-center"
                            >
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative bg-white p-4 rounded-full shadow-lg border-2 border-green-50">
                                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {type === 'withdrawal' ? 'Processing Withdrawal' : 'Processing Payment'}
                                </h3>
                                <p className="text-slate-500 mb-6">Connect secured via Razorpay...</p>

                                <div className="w-full bg-slate-100 rounded-lg p-3 flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-slate-500">Amount</span>
                                    <span className="text-lg font-bold text-slate-800">₹{amount}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Wallet className="w-3 h-3" />
                                    {type === 'withdrawal' ? 'Sending to linked account' : 'Adding to wallet'}
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="p-8 flex flex-col items-center text-center bg-gradient-to-b from-white to-green-50/50"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-green-100 shadow-xl"
                                >
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-green-700 mb-2">
                                    {type === 'withdrawal' ? 'Withdrawal Successful!' : 'Payment Successful!'}
                                </h3>
                                <p className="text-slate-600 mb-6">
                                    {type === 'withdrawal' ? 'Funds have been transferred to your account.' : 'Funds have been added to your wallet.'}
                                </p>

                                <div className="w-full bg-white border border-green-100 rounded-xl p-4 mb-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-500">Transferred Amount</span>
                                        <span className="text-lg font-bold text-green-700">₹{amount}</span>
                                    </div>
                                    {payoutId && (
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                            <span className="text-xs text-slate-400">Transaction ID</span>
                                            <span className="text-xs font-mono text-slate-500">{payoutId}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                                >
                                    Done
                                </button>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                    <XCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-700 mb-2">
                                    {type === 'withdrawal' ? 'Withdrawal Failed' : 'Payment Failed'}
                                </h3>
                                <p className="text-slate-500 mb-6">{errorMessage || 'Something went wrong. Please try again.'}</p>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all"
                                >
                                    Close
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};
