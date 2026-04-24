import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackSection() {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; message?: string }>({});

  const validateForm = () => {
    const newErrors: { rating?: string; message?: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!message.trim()) {
      newErrors.message = 'Please enter your feedback';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate submission delay (frontend only)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after showing success
    setTimeout(() => {
      setName('');
      setRating(0);
      setMessage('');
      setIsSubmitted(false);
    }, 3000);
  };

  const isFormValid = rating > 0 && message.trim().length > 0;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4" />
            We value your opinion
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Share Your <span className="text-primary">Feedback</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help us improve your experience. Your feedback matters to us and helps shape the future of QuickEats.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Thank You!
                </h3>
                <p className="text-muted-foreground">
                  Your feedback has been submitted successfully.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Rating Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Rating <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          setErrors(prev => ({ ...prev, rating: undefined }));
                        }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-accent text-accent'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </div>
                  {errors.rating && (
                    <p className="text-sm text-destructive">{errors.rating}</p>
                  )}
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Your Feedback <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Tell us about your experience..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setErrors(prev => ({ ...prev, message: undefined }));
                    }}
                    className="min-h-[120px] resize-none"
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
