import { Layout } from "@/components/mobile-layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Utensils, List, Plus, ChefHat, Store, AlertCircle } from "lucide-react";
import bgPattern from "@assets/generated_images/subtle_abstract_food_pattern_background.png";
import { useEffect, useMemo, useState } from "react";
import { getClosureSchedules, ClosureSchedule, getFoods } from "@/lib/api";
import type { FoodItem } from "@/lib/store";

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

interface RegularClosure {
  stallName: string;
  locationName: string | null;
}

export default function Home() {
  const [todaysClosures, setTodaysClosures] = useState<ClosureSchedule[]>([]);
  const [allClosures, setAllClosures] = useState<ClosureSchedule[]>([]);
  const [regularClosuresToday, setRegularClosuresToday] = useState<RegularClosure[]>([]);

  useEffect(() => {
    // Fetch scheduled closures and filter for today
    getClosureSchedules()
      .then(closures => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        setAllClosures(closures);
        const todayClosures = closures.filter(c => c.date === todayStr);
        setTodaysClosures(todayClosures);
      })
      .catch(err => console.error('Failed to fetch closures:', err));

    // Fetch food items and compute regular weekly closures
    getFoods()
      .then((items: FoodItem[]) => {
        const todayDow = new Date().getDay(); // 0=Sunday, 1=Monday, ...
        const result: RegularClosure[] = [];

        for (const item of items) {
          if (item.type !== 'out') continue;

          if (item.locations && item.locations.length > 0) {
            const closedLocs = item.locations.filter(loc => {
              if (!loc.closedDays || !loc.closedDays.includes(todayDow)) return false;
              // Skip locations closed more than 5 days/week (reminder-only items like a Sunday church café)
              return loc.closedDays.length <= 5;
            });
            if (closedLocs.length === 0) continue;

            if (closedLocs.length === item.locations.length || item.locations.length === 1) {
              result.push({ stallName: item.name, locationName: closedLocs[0].name });
            } else {
              for (const loc of closedLocs) {
                result.push({ stallName: item.name, locationName: loc.name });
              }
            }
          } else if (item.closedDays && item.closedDays.includes(todayDow) && item.closedDays.length <= 5) {
            // Legacy: closedDays directly on item — skip reminder-only items closed 6+ days/week
            result.push({ stallName: item.name, locationName: null });
          }
        }

        setRegularClosuresToday(result);
      })
      .catch(err => console.error('Failed to fetch foods for closure check:', err));
  }, []);

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const closureBannerLines = useMemo(() => {
    if (todaysClosures.length === 0) return [];
    const lines: { type: 'cleaning' | 'timeoff'; location: string; count?: number; foodItemName?: string; until?: string }[] = [];
    const cleaningByLocation = new Map<string, ClosureSchedule[]>();
    const timeOffList: ClosureSchedule[] = [];
    for (const c of todaysClosures) {
      if (c.type === 'cleaning') {
        const loc = c.location || 'Unknown';
        if (!cleaningByLocation.has(loc)) cleaningByLocation.set(loc, []);
        cleaningByLocation.get(loc)!.push(c);
      } else {
        timeOffList.push(c);
      }
    }
    cleaningByLocation.forEach((closures, location) => {
      const loc = location.trim();
      const displayLoc = loc.toLowerCase().endsWith('hawker centre') ? loc : `${loc} Hawker Centre`;
      lines.push({ type: 'cleaning', location: displayLoc, count: closures.length });
    });
    // One line per stall: same stall can have multiple DB rows (one per day), so dedupe by (location, foodItemName)
    const seenStall = new Set<string>();
    timeOffList.forEach(c => {
      const loc = c.location || 'Unknown';
      const stallName = c.foodItemName || 'Stall';
      const stallKey = `${(loc ?? '').toLowerCase()}|${(stallName ?? '').toLowerCase()}`;
      if (seenStall.has(stallKey)) return;
      seenStall.add(stallKey);
      const allDates = allClosures
        .filter(a =>
          a.type === 'timeoff' &&
          (a.foodItemName ?? '').toLowerCase() === (stallName ?? '').toLowerCase() &&
          (a.location ?? '').toLowerCase() === (loc ?? '').toLowerCase()
        )
        .map(a => a.date)
        .sort();
      let until: string | undefined;
      if (allDates.length > 0) {
        const last = allDates[allDates.length - 1];
        const [, m, d] = last.split('-').map(Number);
        until = `${d} ${MONTHS_SHORT[m - 1]}`;
      }
      lines.push({ type: 'timeoff', location: loc, foodItemName: stallName, until });
    });
    return lines;
  }, [todaysClosures, allClosures]);

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
          <p className="text-muted-foreground text-lg">what and where shall we eat today?</p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 flex-1"
        >
          {/* Closure Alert Banner */}
          {(closureBannerLines.length > 0 || regularClosuresToday.length > 0) && (
            <motion.div 
              variants={item}
              className="bg-muted/50 border border-border rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base mb-1">Closed Today</p>
                <div className="space-y-1">
                  {closureBannerLines
                    .filter(line => {
                      if (line.type !== 'timeoff') return true;
                      // Regular weekly closure takes precedence — hide time-off if stall already shown below
                      return !regularClosuresToday.some(r =>
                        r.stallName.toLowerCase() === (line.foodItemName ?? '').toLowerCase()
                      );
                    })
                    .map((line, i) => (
                    line.type === 'cleaning' ? (
                      <p key={i} className="text-blue-700 text-sm">
                        {line.location}
                      </p>
                    ) : (
                      <div key={i} className="text-amber-700 text-sm">
                        <div>{line.location} — {line.foodItemName}</div>
                        <div>time off{line.until ? <><span className="whitespace-nowrap"> until {line.until}</span></> : ' today'}</div>
                      </div>
                    )
                  ))}
                  {regularClosuresToday.map((entry, i) => (
                    <p key={`reg-${i}`} className="text-muted-foreground text-sm">
                      {entry.locationName
                        ? `${entry.stallName} (${entry.locationName})`
                        : entry.stallName}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

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

            {/* Add Dates Card */}
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
                    <h2 className="text-xl font-bold text-foreground">Add Dates</h2>
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
