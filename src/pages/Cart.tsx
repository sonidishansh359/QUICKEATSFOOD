import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CartItem {
  id: number;
  name: string;
  restaurant: string;
  price: number;
  quantity: number;
  image: string;
}

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Classic Cheeseburger",
    restaurant: "Burger Palace",
    price: 12.99,
    quantity: 2,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Margherita Pizza",
    restaurant: "Pizza Napoli",
    price: 16.99,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    name: "California Roll",
    restaurant: "Tokyo Sushi House",
    price: 14.99,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&auto=format&fit=crop&q=80",
  },
];

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 25 ? 0 : 3.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <>
      <Helmet>
        <title>Your Cart | QuickEats</title>
        <meta
          name="description"
          content="Review your cart and proceed to checkout. Fast delivery from your favorite restaurants."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24 pb-12">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl lg:text-3xl font-bold text-foreground mb-8"
            >
              Your Cart
            </motion.h1>

            {cartItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-4 bg-card border border-border rounded-xl"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.restaurant}
                        </p>
                        <p className="text-primary font-semibold mt-1">
                                                        ₹{item.price.toFixed(2)}
                                                      </p>                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-xl p-6 sticky top-24"
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Order Summary
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">
                                                        ₹{subtotal.toFixed(2)}
                                                      </span>                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Delivery Fee
                        </span>
                        <span className="text-foreground">
                                                        {deliveryFee === 0 ? (
                                                          <span className="text-success">Free</span>
                                                        ) : (
                                                          `₹${deliveryFee.toFixed(2)}`
                                                        )}
                                                      </span>                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="text-foreground">
                                                        ₹{tax.toFixed(2)}
                                                      </span>                      </div>
                      <div className="h-px bg-border my-4" />
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">
                                                        ₹{total.toFixed(2)}
                                                      </span>                      </div>
                    </div>

                    {subtotal < 25 && (
                      <p className="text-xs text-muted-foreground mt-4">
                                                    Add ₹{(25 - subtotal).toFixed(2)} more for free delivery
                                                  </p>                    )}

                    <Button className="w-full mt-6 gap-2" size="lg">
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Link
                      to="/restaurants"
                      className="block text-center text-sm text-primary hover:underline mt-4"
                    >
                      Continue Shopping
                    </Link>
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Your cart is empty
                </h2>
                <p className="text-muted-foreground mb-6">
                  Looks like you haven't added anything to your cart yet.
                </p>
                <Button asChild>
                  <Link to="/restaurants">Browse Restaurants</Link>
                </Button>
              </motion.div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Cart;
