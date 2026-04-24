import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, MapPin, User, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickEatsLogo from "../../assets/logo.webp";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(3);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Restaurants", href: "/restaurants" },
    { name: "Offers", href: "/offers" },
    { name: "Help", href: "/help" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/">
            <img
              src={QuickEatsLogo}
              alt="QuickEats Logo"
              className="h-10 object-contain"
            />
          </Link>

          {/* Location Selector - Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">New York, NY</span>
            <span className="text-xs text-muted-foreground">Change</span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                className="w-full h-10 pl-10 pr-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hidden lg:flex">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="default" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border"
            >
              <div className="py-4 space-y-3">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search restaurants..."
                    className="w-full h-10 pl-10 pr-4 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Mobile Location */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">New York, NY</span>
                </div>

                {/* Mobile Nav Links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}

                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
