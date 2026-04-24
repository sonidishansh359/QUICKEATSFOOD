import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

const categories = [
  { id: 1, name: "Pizza", emoji: "🍕", color: "from-red-500/20 to-orange-500/20" },
  { id: 2, name: "Burgers", emoji: "🍔", color: "from-amber-500/20 to-yellow-500/20" },
  { id: 3, name: "Sushi", emoji: "🍣", color: "from-pink-500/20 to-rose-500/20" },
  { id: 4, name: "Indian", emoji: "🍛", color: "from-orange-500/20 to-amber-500/20" },
  { id: 5, name: "Chinese", emoji: "🥡", color: "from-red-600/20 to-red-400/20" },
  { id: 6, name: "Mexican", emoji: "🌮", color: "from-green-500/20 to-lime-500/20" },
  { id: 7, name: "Italian", emoji: "🍝", color: "from-green-600/20 to-emerald-500/20" },
  { id: 9, name: "Desserts", emoji: "🍰", color: "from-pink-400/20 to-purple-400/20" },
  { id: 10, name: "Coffee", emoji: "☕", color: "from-amber-700/20 to-amber-500/20" },
  { id: 11, name: "Healthy", emoji: "🥗", color: "from-green-400/20 to-teal-400/20" },
  { id: 13, name: "Breakfast", emoji: "🍳", color: "from-orange-400/20 to-red-500/20" },
  { id: 15, name: "Gujarati", emoji: "🥪", color: "from-yellow-500/20 to-orange-500/20" },
  { id: 16, name: "Punjabi", emoji: "🍛", color: "from-red-600/20 to-orange-600/20" },
  { id: 17, name: "South Indian", emoji: "🥥", color: "from-orange-400/20 to-yellow-500/20" },
  { id: 18, name: "Kathiyawadi", emoji: "🌶️", color: "from-red-500/20 to-orange-500/20" },
];

const CategoriesSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Explore by Category
            </h2>
            <p className="text-muted-foreground">
              Find your favorite cuisine from our wide selection
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <button className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card hover:bg-secondary border border-border hover:border-primary/30 transition-all duration-300 min-w-[100px]">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}
                >
                  {category.emoji}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {category.name}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default CategoriesSection;
