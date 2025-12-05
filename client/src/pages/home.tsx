import { Layout } from "@/components/mobile-layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Utensils, List, Plus, ChefHat, Store } from "lucide-react";
import bgPattern from "@assets/generated_images/subtle_abstract_food_pattern_background.png";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Home() {
  return (
    <Layout>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none z-[-1]" 
        style={{ backgroundImage: `url(${bgPattern})`, backgroundSize: '300px' }}
      />

      <div className="flex-1 flex flex-col justify-center gap-6 py-8">
        <div className="mb-4 px-2">
          <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight">Food<br/><span className="text-foreground italic">Faster</span></h1>
          <p className="text-muted-foreground text-lg">Where shall we eat today?</p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 flex-1"
        >
          {/* Decide Card */}
          <Link href="/decide">
            <motion.div 
              variants={item}
              className="h-48 w-full bg-primary rounded-3xl p-6 relative overflow-hidden group cursor-pointer shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              <div className="absolute right-[-20px] bottom-[-20px] text-primary-foreground/20 group-hover:text-primary-foreground/30 transition-colors rotate-[-15deg]">
                <Utensils size={140} strokeWidth={1.5} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center text-white">
                  <Utensils size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Decide</h2>
                  <p className="text-primary-foreground/80 font-medium">Help me choose what to eat</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            {/* Food List Card */}
            <Link href="/list">
              <motion.div 
                variants={item}
                className="aspect-square bg-secondary rounded-3xl p-5 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all active:scale-[0.95]"
              >
                <div className="absolute right-[-10px] bottom-[-10px] text-secondary-foreground/10 group-hover:text-secondary-foreground/20 transition-colors">
                  <List size={100} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="bg-white/40 w-10 h-10 rounded-xl flex items-center justify-center text-secondary-foreground">
                    <List size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-secondary-foreground">Food List</h2>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Add Info Card */}
            <Link href="/add">
              <motion.div 
                variants={item}
                className="aspect-square bg-card border-2 border-dashed border-muted-foreground/20 rounded-3xl p-5 relative overflow-hidden group cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all active:scale-[0.95]"
              >
                <div className="absolute right-[-10px] bottom-[-10px] text-muted-foreground/5 group-hover:text-primary/10 transition-colors">
                  <Plus size={100} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="bg-muted w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Add Info</h2>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
