import { useState, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  role: UserRole;
  onBack: () => void;
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

export function AuthForm({ role, onBack }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login, signup, googleLogin, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_BASE_URL = (import.meta.env.VITE_API_URL?.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`);

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
        navigate(roleRedirects[role]);
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Please check your credentials and try again.',
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

    setIsLoading(true);

    try {
      const result = await signup(email, password, name, role, {}, () => {
        startTransition(() => {
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
      const success = await googleLogin(role, () => {
        startTransition(() => {
          navigate(roleRedirects[role]);
        });
      });
      if (success) {
        toast({
          title: 'Welcome!',
          description: 'Signed in with Google',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Google sign-in failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setResetSent(true);
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Choose different role</span>
      </button>

      <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
        <AnimatePresence mode="wait">
          {mode === 'otp' ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Enter OTP</h2>
                <p className="text-muted-foreground mt-2">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-12 text-center text-2xl tracking-widest"
                    required
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in 10 minutes
                  </p>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading || otp.length !== 6}>
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Set New Password</h2>
                <p className="text-muted-foreground mt-2">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
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
                      className="pl-10 pr-10 h-12"
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
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                <p className="text-muted-foreground mt-2">
                  Enter your email address
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
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
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
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
          ) : (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {mode === 'login' ? 'Sign in' : 'Sign up'} as {roleLabels[role]}
                </p>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {mode === 'signup' && (
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
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
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
                      className="pl-10 h-12"
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
                      className="pl-10 pr-10 h-12"
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
                        className="pl-10 pr-10 h-12"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
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
    </motion.div>
  );
}