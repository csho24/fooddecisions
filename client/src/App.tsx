import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Decide from "@/pages/decide";
import ListPage from "@/pages/list";
import AddPage from "@/pages/add-details";
import { useEffect } from "react";
import { useFoodStore } from "@/lib/store";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/decide" component={Decide}/>
      <Route path="/list" component={ListPage}/>
      <Route path="/add" component={AddPage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const fetchItems = useFoodStore((state) => state.fetchItems);
  const fetchArchives = useFoodStore((state) => state.fetchArchives);

  useEffect(() => {
    fetchItems();
    fetchArchives();
  }, [fetchItems, fetchArchives]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
