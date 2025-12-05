import { useState, useEffect } from "react";
import { Layout } from "@/components/mobile-layout";
import { useFoodStore, FoodItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Home as HomeIcon, Store, RefreshCw, Check, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

export default function Decide() {
  const { getDecisions } = useFoodStore();
  const [step, setStep] = useState<'type' | 'spinning' | 'result'>('type');
  const [selectedType, setSelectedType] = useState<'all' | 'home' | 'out'>('all');
  const [result, setResult] = useState<FoodItem | null>(null);
  const [availableItems, setAvailableItems] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset store filter when component mounts or changes
    useFoodStore.setState({ filter: selectedType });
    const items = getDecisions();
    setAvailableItems(items);
  }, [selectedType]);

  const handleSpin = () => {
    if (availableItems.length === 0) {
      setError("No options available right now! Check your list constraints.");
      return;
    }
    setError(null);
    setStep('spinning');
    
    // Mock spin delay
    setTimeout(() => {
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      setResult(randomItem);
      setStep('result');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff9f43', '#10ac84', '#ff6b6b']
      });
    }, 1500);
  };

  return (
    <Layout showBack title="Decide">
      <AnimatePresence mode="wait">
        {step === 'type' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full justify-center gap-6"
          >
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-bold">First things first</h2>
              <p className="text-muted-foreground">Where do you feel like eating?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant={selectedType === 'home' ? 'default' : 'outline'}
                className="h-24 text-lg rounded-2xl flex flex-col gap-2 border-2"
                onClick={() => setSelectedType('home')}
              >
                <HomeIcon size={28} />
                Eat at Home
              </Button>
              
              <Button 
                variant={selectedType === 'out' ? 'default' : 'outline'}
                className="h-24 text-lg rounded-2xl flex flex-col gap-2 border-2"
                onClick={() => setSelectedType('out')}
              >
                <Store size={28} />
                Go Out
              </Button>
              
              <Button 
                variant={selectedType === 'all' ? 'secondary' : 'ghost'}
                className="h-12 rounded-xl"
                onClick={() => setSelectedType('all')}
              >
                I don't mind either
              </Button>
            </div>

            <div className="mt-auto">
              <Button size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20" onClick={handleSpin}>
                Find me food!
              </Button>
              {error && (
                <p className="text-destructive text-center mt-4 text-sm bg-destructive/10 p-3 rounded-lg flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {step === 'spinning' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-6"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="text-primary"
            >
              <RefreshCw size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary animate-pulse">Checking availability...</h2>
            <p className="text-muted-foreground">Considering opening hours & closed days...</p>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col justify-center items-center text-center gap-8"
          >
            <div className="space-y-2">
              <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">You should eat</p>
              <h1 className="text-4xl font-display font-bold text-foreground">{result.name}</h1>
            </div>

            <div className="bg-card p-6 rounded-3xl shadow-xl border border-border w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                {result.type === 'home' ? <HomeIcon /> : <Store />}
                <span className="font-medium capitalize">{result.type}</span>
              </div>
              
              {result.location && (
                <p className="text-lg mb-2">{result.location}</p>
              )}
              
              {result.notes && (
                <div className="bg-secondary/50 p-3 rounded-xl text-sm text-secondary-foreground">
                  "{result.notes}"
                </div>
              )}
              
              {result.openingHours && (
                 <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
                   Open today: {result.openingHours.open} - {result.openingHours.close}
                 </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <Button size="lg" className="w-full h-14 rounded-xl text-lg" onClick={() => setStep('type')}>
                Decide Again
              </Button>
              <Button variant="outline" className="w-full rounded-xl" onClick={handleSpin}>
                Spin Again ({selectedType})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
