import { useState, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, User, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  initialMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'otp' | 'reset';

const roleLabels: Record<UserRole, string> = {
  user: 'Customer',
  owner: 'Restaurant Owner',
  delivery: 'Delivery Partner',
};

const roleRedirects: Record<UserRole, string> = {
  user: '/user/dashboard',
  owner: '/owner/dashboard',
  delivery: '/delivery/dashboard',
};

import loginFaceImage from '@/assets/loginface.webp';
import cookImage from '@/assets/cook1.avif';
import deliveryImage from '@/assets/pngtree-food-delivery-by-scooters-free-download-png-image_13741129-removebg-preview.png';

const roleImages: Record<UserRole, string> = {
  user: loginFaceImage,
  owner: cookImage,
  delivery: deliveryImage,
};

export function AuthModal({ isOpen, onClose, role, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login, signup, googleLogin, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password, role);
      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${roleLabels[role]}`,
        });
        onClose();
        navigate(roleRedirects[role]);
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Please check your credentials.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    // Phone validation for delivery boys
    if (role === 'delivery' && (!phone || phone.replace(/\D/g, '').length < 10)) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid mobile number.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const additionalData = role === 'delivery'
        ? { vehicleType, licenseNumber, phone }
        : {};
      const result = await signup(email, password, name, role, additionalData, () => {
        startTransition(() => {
          onClose();
          navigate(roleRedirects[role]);
        });
      });
      if (result.success) {
        toast({
          title: 'Account Created!',
          description: `Welcome to QuickEats, ${name}!`,
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await googleLogin(role);
      if (success) {
        toast({
          title: 'Welcome!',
          description: 'Signed in with Google',
        });
        onClose();
        navigate(roleRedirects[role]);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Google sign-in failed.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const API_BASE_URL = (import.meta.env.VITE_API_URL?.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setMode('otp');
        toast({
          title: 'OTP Sent',
          description: 'Check your email for the verification code.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMode('reset');
        toast({
          title: 'OTP Verified',
          description: 'Enter your new password.',
        });
      } else {
        toast({
          title: 'Invalid OTP',
          description: data.message || 'Please check the code and try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Password Reset Successful',
          description: 'You can now login with your new password.',
        });
        resetForm();
        setMode('login');
      } else {
        toast({
          title: 'Reset Failed',
          description: data.message || 'Failed to reset password.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setVehicleType('bike');
    setLicenseNumber('');
    setResetSent(false);
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto bg-card">
        <div className="relative">
          {/* Header with gradient */}
          <div className="bg-gradient-primary p-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 overflow-hidden"
            >
              <img
                src={roleImages[role]}
                alt={roleLabels[role]}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary-foreground">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {mode === 'login' ? 'Sign in' : 'Sign up'} as {roleLabels[role]}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'otp' ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-12 text-center text-2xl tracking-widest text-lg"
                        required
                        maxLength={6}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Code expires in 10 minutes
                      </p>
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading || otp.length !== 6}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Back to Login
                    </button>
                  </form>
                </motion.div>
              ) : mode === 'reset' ? (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10 h-11"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirm-new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pl-10 pr-10 h-11"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Back to Login
                    </button>
                  </form>
                </motion.div>
              ) : mode === 'forgot' ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Back to Login
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                    {mode === 'signup' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="name"
                              type="text"
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>

                        {role === 'delivery' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                  id="phone"
                                  type="tel"
                                  placeholder="+91 98765 43210"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="pl-10 h-11"
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="vehicle-type">Vehicle Type</Label>
                              <select
                                id="vehicle-type"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground"
                                required
                              >
                                <option value="bike">Bike</option>
                                <option value="scooter">Scooter</option>
                                <option value="car">Car</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="license-number">License Number</Label>
                              <Input
                                id="license-number"
                                type="text"
                                placeholder="ABC123456"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                className="h-11"
                                required
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 h-11"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        mode === 'login' ? 'Sign In' : 'Create Account'
                      )}
                    </Button>
                  </form>

                  {role === 'user' && (
                    <>
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </Button>
                    </>
                  )}

                  <p className="text-center text-sm text-muted-foreground mt-5">
                    {mode === 'login' ? (
                      <>
                        New here?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="text-primary font-medium hover:underline"
                        >
                          Create account
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="text-primary font-medium hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
