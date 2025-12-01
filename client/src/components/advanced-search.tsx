import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, MapPin, Filter, Clock, Users } from "lucide-react";

interface SearchFilters {
  query: string;
  city: string;
  sport: string;
  date: string;
  timeSlot: string;
  maxDistance: string;
  priceRange: string;
}

interface SearchResult {
  id: string;
  type: 'court' | 'facility' | 'organization';
  name: string;
  description: string;
  city: string;
  distance?: number;
  rating?: number;
  price?: number;
  tags: string[];
}

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    city: "",
    sport: "",
    date: "",
    timeSlot: "",
    maxDistance: "",
    priceRange: ""
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (searchData: SearchFilters) => {
      const response = await apiRequest("POST", "/api/search", searchData);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      toast({
        title: "Search Complete",
        description: `Found ${data.results?.length || 0} results`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search",
        variant: "destructive",
      });
    },
  });

  const nearbySearchMutation = useMutation({
    mutationFn: async (radius: number) => {
      const response = await apiRequest("GET", `/api/nearby?radius=${radius}`);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      toast({
        title: "Nearby Search Complete",
        description: `Found ${data.results?.length || 0} nearby courts`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Nearby Search Failed",
        description: error.message || "Failed to find nearby courts",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMutation.mutate(filters);
  };

  const handleNearbySearch = () => {
    const radius = parseInt(filters.maxDistance) || 10;
    nearbySearchMutation.mutate(radius);
  };

  const getSuggestions = () => {
    const suggestions = [
      "Badminton Court", "Tennis Court", "Basketball Court", 
      "Football Field", "Cricket Ground", "Swimming Pool"
    ];
    return suggestions.filter(s => 
      s.toLowerCase().includes(filters.query.toLowerCase())
    ).slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Advanced Search & Discovery
          </CardTitle>
          <CardDescription>
            Find courts, facilities, and organizations with powerful search and location-based discovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search courts, facilities, organizations..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              
              {/* Search Suggestions */}
              {filters.query && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 mt-1">
                  {getSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => handleFilterChange("query", suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="submit"
                disabled={searchMutation.isPending}
                className="btn-primary"
              >
                {searchMutation.isPending ? "Searching..." : "Search"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleNearbySearch}
                disabled={nearbySearchMutation.isPending}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {nearbySearchMutation.isPending ? "Finding..." : "Find Nearby"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Mumbai, Delhi, Bangalore..."
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sport">Sport Type</Label>
                  <Select value={filters.sport} onValueChange={(value) => handleFilterChange("sport", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange("date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot</Label>
                  <Select value={filters.timeSlot} onValueChange={(value) => handleFilterChange("timeSlot", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                      <SelectItem value="evening">Evening (6 PM - 10 PM)</SelectItem>
                      <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDistance">Max Distance (km)</Label>
                  <Select value={filters.maxDistance} onValueChange={(value) => handleFilterChange("maxDistance", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Within 5 km</SelectItem>
                      <SelectItem value="10">Within 10 km</SelectItem>
                      <SelectItem value="25">Within 25 km</SelectItem>
                      <SelectItem value="50">Within 50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange("priceRange", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-500">₹0 - ₹500</SelectItem>
                      <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                      <SelectItem value="1000-2000">₹1000 - ₹2000</SelectItem>
                      <SelectItem value="2000+">₹2000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{result.name}</h3>
                        <Badge variant={result.type === 'court' ? 'default' : result.type === 'facility' ? 'secondary' : 'outline'}>
                          {result.type}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{result.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {result.city}
                          {result.distance && ` (${result.distance.toFixed(1)} km away)`}
                        </div>
                        
                        {result.price && (
                          <div className="flex items-center">
                            <span className="font-medium">₹{result.price}/hour</span>
                          </div>
                        )}
                        
                        {result.rating && (
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{result.rating}/5</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {result.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button size="sm" className="btn-primary">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
