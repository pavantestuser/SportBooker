import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Organizations from "@/pages/organizations";
import Facilities from "@/pages/facilities";
import Slots from "@/pages/slots";
import Booking from "@/pages/booking";
import Coupons from "@/pages/coupons";
import Users from "@/pages/users";
import Search from "@/pages/search";
import LocationSetupPage from "@/pages/location-setup";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-gray">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sporty-blue mx-auto mb-4"></div>
          <p className="text-dark-gray">Loading SportBook Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/search" component={Search} />
        <Route path="/organizations" component={Organizations} />
        <Route path="/facilities" component={Facilities} />
        <Route path="/slots" component={Slots} />
        <Route path="/booking" component={Booking} />
        <Route path="/coupons" component={Coupons} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
