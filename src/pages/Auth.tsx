import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserRole } from "@/types/auth";

const Auth = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const roleRedirects = {
        user: '/user/dashboard',
        owner: '/owner/dashboard',
        delivery: '/delivery/dashboard',
      };
      navigate(roleRedirects[user.role], { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedRole) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => setSelectedRole(null)}
        role={selectedRole}
      />
    );
  }

  const roles = [
    {
      role: 'user' as UserRole,
      title: 'Customer',
      description: 'Order delicious food from your favorite restaurants',
      emoji: '🍔',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      role: 'owner' as UserRole,
      title: 'Restaurant Owner',
      description: 'Manage your restaurant and grow your business',
      emoji: '👨‍🍳',
      gradient: 'from-blue-500 to-purple-500',
    },
    {
      role: 'delivery' as UserRole,
      title: 'Delivery Partner',
      description: 'Deliver food and earn money on your schedule',
      emoji: '🛵',
      gradient: 'from-green-500 to-teal-500',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Join QuickEats | Choose Your Role</title>
        <meta
          name="description"
          content="Join QuickEats as a customer, restaurant owner, or delivery partner. Start your food journey today."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  Q
                </span>
              </div>
              <span className="text-xl font-bold text-foreground">
                Quick<span className="text-primary">Eats</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Welcome to <span className="text-gradient">QuickEats</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your role to get started with the best food delivery experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedRole(role.role)}
              >
                <div className="bg-card border border-border rounded-2xl p-8 h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-4xl">{role.emoji}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-3 text-center">
                    {role.title}
                  </h3>

                  <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Auth;
