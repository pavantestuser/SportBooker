import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Bookmark, IndianRupee, Users, Plus, CalendarPlus, TrendingUp } from "lucide-react";
import SlotCreationForm from "@/components/slot-creation-form";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark-gray">Sports Booking Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentRole = userInfo?.currentRole || 'user';
  const canCreateOrg = currentRole === 'app_admin';
  const canCreateSlot = ['app_admin', 'org_admin', 'staff'].includes(currentRole);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">Sports Booking Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your sports facilities and bookings efficiently</p>
        </div>
        <div className="flex space-x-3">
          {canCreateOrg && (
            <Button 
              className="btn-secondary"
              onClick={() => setLocation('/organizations')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          )}
          {canCreateSlot && (
            <Button 
              className="btn-primary"
              onClick={() => setLocation('/slots')}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Create Slot
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Organizations</p>
                <p className="text-2xl font-bold text-dark-gray">{metrics?.totalOrgs || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-sporty-blue" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-fresh-green mr-1" />
              <span className="text-fresh-green text-sm font-medium">+12%</span>
              <span className="text-gray-600 text-sm ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Bookings</p>
                <p className="text-2xl font-bold text-dark-gray">{metrics?.activeBookings || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Bookmark className="h-6 w-6 text-fresh-green" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-fresh-green mr-1" />
              <span className="text-fresh-green text-sm font-medium">+8%</span>
              <span className="text-gray-600 text-sm ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-dark-gray">₹{metrics?.revenue?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <IndianRupee className="h-6 w-6 text-vibrant-yellow" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-fresh-green mr-1" />
              <span className="text-fresh-green text-sm font-medium">+15%</span>
              <span className="text-gray-600 text-sm ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-dark-gray">{metrics?.activeUsers?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-fresh-green mr-1" />
              <span className="text-fresh-green text-sm font-medium">+5%</span>
              <span className="text-gray-600 text-sm ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot Creation Interface */}
      {canCreateSlot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SlotCreationForm />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Recent Bookings */}
            <Card className="card-light">
              <CardHeader>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-fresh-green rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-dark-gray">Court A - Basketball</p>
                        <p className="text-xs text-gray-600">Today, 5:00-6:00 PM</p>
                      </div>
                    </div>
                    <span className="text-xs bg-fresh-green text-white px-2 py-1 rounded-full">Confirmed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-vibrant-yellow rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-dark-gray">Court B - Tennis</p>
                        <p className="text-xs text-gray-600">Tomorrow, 8:00-9:00 AM</p>
                      </div>
                    </div>
                    <span className="text-xs bg-vibrant-yellow text-dark-gray px-2 py-1 rounded-full">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-sporty-blue rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-dark-gray">Court C - Badminton</p>
                        <p className="text-xs text-gray-600">Jan 16, 6:00-7:00 PM</p>
                      </div>
                    </div>
                    <span className="text-xs bg-sporty-blue text-white px-2 py-1 rounded-full">Reserved</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Center */}
            <Card className="card-light">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Push Notifications</CardTitle>
                  <div className="h-6 w-6 text-sporty-blue">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-sporty-blue">
                    <p className="text-sm font-medium text-dark-gray">Booking Confirmed</p>
                    <p className="text-xs text-gray-600">Court booking for 5:00-6:00 PM confirmed via FCM</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-fresh-green">
                    <p className="text-sm font-medium text-dark-gray">Payment Received</p>
                    <p className="text-xs text-gray-600">₹500 payment processed successfully</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-vibrant-yellow">
                    <p className="text-sm font-medium text-dark-gray">Reminder Sent</p>
                    <p className="text-xs text-gray-600">Booking reminder sent 1 hour before slot</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-sporty-blue hover:text-blue-600"
                  onClick={() => setLocation('/notifications')}
                >
                  Configure Push Notifications →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* User Dashboard */}
      {currentRole === 'user' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-light">
            <CardHeader>
              <CardTitle className="text-xl">Quick Booking</CardTitle>
              <CardDescription>Book your next sports session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full btn-primary"
                onClick={() => setLocation('/booking')}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Start Booking
              </Button>
            </CardContent>
          </Card>

          <Card className="card-light">
            <CardHeader>
              <CardTitle className="text-xl">My Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center py-8">
                No recent bookings found. Start booking to see your history here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
