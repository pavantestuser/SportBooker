import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Navigation, Search, X } from "lucide-react";

// Popular Indian cities with coordinates (like BookMyShow)
const popularCities = [
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, state: "Delhi" },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, state: "West Bengal" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319, state: "Uttar Pradesh" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh" },
  { name: "Indore", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812, state: "Gujarat" },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, state: "Tamil Nadu" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
];

interface LocationSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function LocationSetup({ onComplete, onSkip }: LocationSetupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<typeof popularCities[0] | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredCities = popularCities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { city: string; latitude: number; longitude: number }) => {
      const response = await apiRequest("POST", "/api/user/location", locationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Location Updated! 📍",
        description: "Your location has been saved. You can now discover nearby courts.",
      });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setIsGettingLocation(false);
          
          // Find nearest city or use coordinates directly
          updateLocationMutation.mutate({
            city: "Current Location",
            latitude,
            longitude
          });
          
          toast({
            title: "Location Found! 🎯",
            description: "Using your current GPS location for nearby court discovery.",
          });
        },
        (error) => {
          setIsGettingLocation(false);
          toast({
            title: "Location Access Denied",
            description: "Please select your city manually from the list below.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsGettingLocation(false);
      toast({
        title: "Location Not Supported",
        description: "Please select your city manually from the list below.",
        variant: "destructive",
      });
    }
  };

  const handleCitySelect = (city: typeof popularCities[0]) => {
    setSelectedCity(city);
    updateLocationMutation.mutate({
      city: city.name,
      latitude: city.lat,
      longitude: city.lng
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-gray p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center flex-1">
              <MapPin className="h-8 w-8 text-sporty-blue mr-2" />
              <h1 className="text-2xl font-bold text-dark-gray">Set Your Location</h1>
            </div>
            {onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardTitle className="text-xl">
            Discover Sports Facilities Near You
          </CardTitle>
          <CardDescription>
            Choose your location to find courts, gyms, and sports facilities in your area
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* GPS Location Button */}
          <div className="text-center">
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation || updateLocationMutation.isPending}
              className="btn-primary px-8 py-3"
              size="lg"
            >
              {isGettingLocation ? (
                "Getting Location..."
              ) : (
                <>
                  <Navigation className="h-5 w-5 mr-2" />
                  Use Current Location
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Get precise location for accurate nearby recommendations
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* City Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for your city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Popular Cities Grid */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                {searchTerm ? "Search Results" : "Popular Cities"}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {filteredCities.map((city) => (
                  <Button
                    key={`${city.name}-${city.state}`}
                    variant="outline"
                    className="h-auto p-4 text-left flex flex-col items-start hover:bg-blue-50 hover:border-sporty-blue"
                    onClick={() => handleCitySelect(city)}
                    disabled={updateLocationMutation.isPending}
                  >
                    <div className="font-medium">{city.name}</div>
                    <div className="text-xs text-gray-500">{city.state}</div>
                  </Button>
                ))}
              </div>
              
              {filteredCities.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No cities found matching "{searchTerm}"</p>
                  <p className="text-sm">Try searching for a nearby major city</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected City Display */}
          {selectedCity && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">
                    📍 {selectedCity.name}, {selectedCity.state}
                  </h4>
                  <p className="text-sm text-green-600">
                    Location saved! You can now discover nearby sports facilities.
                  </p>
                </div>
                <Badge className="bg-green-600">
                  {updateLocationMutation.isPending ? "Saving..." : "Saved"}
                </Badge>
              </div>
            </div>
          )}

          {/* Skip Option */}
          {onSkip && (
            <div className="text-center pt-4 border-t">
              <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                Skip for now - Set location later
              </Button>
            </div>
          )}

          {/* Benefits Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-dark-gray mb-2">🎯 Location Benefits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Find courts and facilities within walking distance</li>
              <li>• Get recommendations based on your preferences</li>
              <li>• Filter search results by distance</li>
              <li>• Discover new sports venues in your area</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
