import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Assuming this exists based on Landing.tsx
import { Input } from '@/components/ui/input';   // Assuming this exists
import { Label } from '@/components/ui/label';   // Assuming this exists
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Assuming this exists
import { MessageCircle, X, Phone, User, Handshake } from 'lucide-react';
import contactImage from '@/assets/contact-illustration.svg'; // Placeholder, I will use a reliable existing image or valid placeholder logic

export function ConnectSidePanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: 'user', // Default valid value
    });

    const togglePanel = () => setIsOpen(!isOpen);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (value: string) => {
        setFormData((prev) => ({ ...prev, role: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, mobile, role } = formData;

        if (!name || !mobile) {
            alert("Please fill in all required fields.");
            return;
        }

        // Format the message
        const text = `Hello! My name is ${name}. My mobile number is ${mobile}. I am a ${role} and I would like to connect with QuickEats.`;
        const encodedText = encodeURIComponent(text);
        const targetNumber = '917862885851'; // Added country code 91 as per previous context in Landing.tsx

        // Open WhatsApp
        window.open(`https://wa.me/${targetNumber}?text=${encodedText}`, '_blank');
    };

    return (
        <>
            {/* Floating Handle */}
            <motion.div
                className="fixed top-1/2 right-0 z-50 translate-y-[-50%]"
                initial={{ x: 0 }}
                animate={{ x: isOpen ? 300 : 0 }} // Move out when panel opens
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {!isOpen && (
                    <Button
                        onClick={togglePanel}
                        className="rounded-l-full rounded-r-none h-auto py-4 pl-3 pr-2 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex flex-col items-center gap-2 border-y border-l border-white/20"
                    >
                        <Handshake className="w-5 h-5 animate-pulse" />
                        <span className="text-xs font-bold writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Connect With Us</span>
                    </Button>
                )}
            </motion.div>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={togglePanel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                )}
            </AnimatePresence>

            {/* Slide-out Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-background shadow-2xl z-50 border-l border-border flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-primary text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <h2 className="text-lg font-bold">Connect With Us</h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={togglePanel} className="hover:bg-primary-foreground/20 text-primary-foreground">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* Illustration Area */}
                            <div className="mb-6 flex justify-center">
                                {/* Using a generic SVG if the image doesn't exist, or just an icon setup */}
                                <div className="w-40 h-40 bg-primary/10 rounded-full flex items-center justify-center">
                                    <img
                                        src="/src/assets/loginface.webp"
                                        alt="Contact Support"
                                        className="w-32 h-32 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-muted-foreground text-sm">Have a query? Fill out the form below and chat with our admin directly on WhatsApp!</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Enter your Name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number <span className="text-red-500">*</span></Label>
                                    <div className="relative flex">
                                        <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm border-input">
                                            IN +91
                                        </div>
                                        <Input
                                            id="mobile"
                                            name="mobile"
                                            type="tel"
                                            placeholder="Enter Mobile Number"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                            className="rounded-l-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">I am a:</Label>
                                    <RadioGroup
                                        defaultValue="user"
                                        value={formData.role}
                                        onValueChange={handleRoleChange}
                                        className="flex flex-col gap-2 mt-1"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="user" id="r-user" />
                                            <Label htmlFor="r-user" className="cursor-pointer">User</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="owner" id="r-owner" />
                                            <Label htmlFor="r-owner" className="cursor-pointer">Restaurant Owner</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="deliveryboy" id="r-deliveryboy" />
                                            <Label htmlFor="r-deliveryboy" className="cursor-pointer">Delivery Boy</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <Button type="submit" className="w-full mt-4" size="lg">
                                    Connect
                                </Button>
                            </form>
                        </div>

                        <div className="p-4 bg-muted/30 text-center border-t border-border">
                            <p className="text-xs text-muted-foreground">We usually reply within a few minutes.</p>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
