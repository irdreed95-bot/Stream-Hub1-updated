import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { useState, useCallback } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MovieDetails from "@/pages/MovieDetails";
import SeriesDetails from "@/pages/SeriesDetails";
import LiveTV from "@/pages/LiveTV";
import TV from "@/pages/TV";
import Search from "@/pages/Search";
import AdminDashboard from "@/pages/AdminDashboard";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Categories from "@/pages/Categories";
import Profile from "@/pages/Profile";
import Downloads from "@/pages/Downloads";
import Tickets from "@/pages/Tickets";
import Chat from "@/pages/Chat";
import AiAssistant from "@/pages/AiAssistant";
import { Sidebar } from "@/components/Sidebar";
import { AdminBanner } from "@/components/AdminBanner";
import { Footer } from "@/components/Footer";
import { SplashScreen } from "@/components/SplashScreen";
import { UpdateBanner } from "@/components/UpdateBanner";
import { AdBanner } from "@/components/AdBanner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 } },
});

function Router() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#06060a] overflow-x-hidden">
      {/* AdminBanner sits above the whole layout so it never joins the side-by-side flex row */}
      <AdminBanner />
      <div className="flex flex-1 flex-col md:flex-row min-h-0">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-16 md:pb-0 flex flex-col">
        <UpdateBanner />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/movie/:id" component={MovieDetails} />
          <Route path="/tv/:id" component={SeriesDetails} />
          <Route path="/live" component={LiveTV} />
          <Route path="/tv" component={TV} />
          <Route path="/search" component={Search} />
          <Route path="/categories" component={Categories} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={Login} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/tickets" component={Tickets} />
          <Route path="/chat" component={Chat} />
          <Route path="/ai" component={AiAssistant} />
          <Route component={NotFound} />
        </Switch>
        <Footer />
      </main>
      {/* AdBanner is now a no-op overlay — ads are inline in content rows */}
      <AdBanner />
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("sorad_splash_shown");
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("sorad_splash_shown", "1");
    setShowSplash(false);
  }, []);

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
