import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvancedSearch from "@/components/advanced-search";
import { apiRequest } from "@/lib/queryClient";
import { Search, MapPin, Clock, Users, Star, Navigation } from "lucide-react";

export default function SearchPage() {
  const [quickSearch, setQuickSearch] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState(10);

  // Quick search for recent bookings and popular courts
  const { data: popularCourts } = useQuery({
    queryKey: ['/api/courts/filter', { availableOnly: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courts/filter?availableOnly=true");
      return response.json();
    }
  });

  const { data: userLocation } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/me");
      return response.json();
    }
  });

  const handleQuickSearch = () => {
    // This would trigger a search
    console.log("Quick search for:", quickSearch);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location:", position.coords);
          // Use this location for nearby search
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-dark-gray">
          🔍 Sports Court Discovery
        </h1>
        <p className="text-gray-600">
          Find and book the perfect sports facilities near you
        </p>
      </div>

      {/* Quick Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Quick search: Badminton, Tennis, Basketball..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button onClick={handleQuickSearch} className="btn-primary">
              Search
            </Button>
            <Button variant="outline" onClick={getCurrentLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Near Me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="advanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
          <TabsTrigger value="nearby">Nearby Courts</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recommendations">For You</TabsTrigger>
        </TabsList>

        <TabsContent value="advanced">
          <AdvancedSearch />
        </TabsContent>

        <TabsContent value="nearby" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Nearby Sports Facilities
              </CardTitle>
              <CardDescription>
                Discover courts and facilities within your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userLocation?.user?.latitude && userLocation?.user?.longitude ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Your location: {userLocation.user.city || "Location detected"}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Mock nearby courts */}
                    {[
                      {
                        id: "1",
                        name: "Sports Complex A",
                        type: "Multi-sport facility",
                        distance: 2.3,
                        rating: 4.5,
                        availableSlots: 8,
                        priceFrom: 500,
                        tags: ["Badminton", "Tennis", "Basketball"]
                      },
                      {
                        id: "2", 
                        name: "Tennis Center Pro",
                        type: "Tennis facility",
                        distance: 3.7,
                        rating: 4.8,
                        availableSlots: 4,
                        priceFrom: 800,
                        tags: ["Tennis", "Coaching"]
                      },
                      {
                        id: "3",
                        name: "Community Sports Hub",
                        type: "Public facility",
                        distance: 5.1,
                        rating: 4.2,
                        availableSlots: 12,
                        priceFrom: 300,
                        tags: ["Football", "Cricket", "Basketball"]
                      }
                    ].map((facility) => (
                      <Card key={facility.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{facility.name}</CardTitle>
                              <CardDescription>{facility.type}</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {facility.distance} km
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              {facility.rating}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {facility.availableSlots} slots
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {facility.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium">
                              From ₹{facility.priceFrom}/hour
                            </span>
                            <Button size="sm" className="btn-primary">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Enable Location Access
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Allow location access to discover nearby sports facilities
                  </p>
                  <Button onClick={getCurrentLocation}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Get My Location
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Popular Courts & Facilities
              </CardTitle>
              <CardDescription>
                Most booked and highest rated facilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mock popular courts */}
                {[
                  {
                    rank: 1,
                    name: "Elite Tennis Academy",
                    bookings: 1250,
                    rating: 4.9,
                    city: "Mumbai",
                    specialty: "Professional Tennis",
                    priceRange: "₹1000-2000"
                  },
                  {
                    rank: 2,
                    name: "Champions Badminton Center",
                    bookings: 980,
                    rating: 4.7,
                    city: "Bangalore",
                    specialty: "Badminton",
                    priceRange: "₹600-1200"
                  },
                  {
                    rank: 3,
                    name: "Sports City Complex",
                    bookings: 856,
                    rating: 4.6,
                    city: "Delhi",
                    specialty: "Multi-sport",
                    priceRange: "₹400-800"
                  },
                  {
                    rank: 4,
                    name: "Aqua Sports Center",
                    bookings: 742,
                    rating: 4.8,
                    city: "Chennai",
                    specialty: "Swimming & Sports",
                    priceRange: "₹500-1500"
                  }
                ].map((facility) => (
                  <div key={facility.rank} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="bg-sporty-blue text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {facility.rank}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{facility.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{facility.specialty}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {facility.city}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {facility.bookings} bookings
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {facility.rating}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{facility.priceRange}/hour</span>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Based on your preferences and booking history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Recommendation categories */}
                <div>
                  <h3 className="font-semibold mb-3">🎯 Because you play Badminton</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Premium Badminton Arena", "City Shuttle Club", "Indoor Sports Center"].map((name, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h4 className="font-medium">{name}</h4>
                          <p className="text-sm text-gray-600 mb-2">4.5 ⭐ • 2.3 km away</p>
                          <Badge variant="outline" className="text-xs">Badminton</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">📍 Near your frequent locations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Workplace Sports Complex", "Neighborhood Courts", "Mall Sports Zone"].map((name, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h4 className="font-medium">{name}</h4>
                          <p className="text-sm text-gray-600 mb-2">4.3 ⭐ • Near Office</p>
                          <Badge variant="outline" className="text-xs">Multi-sport</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">⏰ Available for your usual time slots</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Evening Sports Hub", "After Work Courts", "Flexible Hours Center"].map((name, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h4 className="font-medium">{name}</h4>
                          <p className="text-sm text-gray-600 mb-2">4.6 ⭐ • 6-9 PM available</p>
                          <Badge variant="outline" className="text-xs">Evening slots</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
