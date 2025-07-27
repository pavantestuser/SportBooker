import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Star } from "lucide-react";
import BookingInterface from "@/components/booking-interface";

export default function Booking() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: facilities } = useQuery({
    queryKey: ['/api/organizations', selectedOrgId, 'facilities'],
    enabled: !!selectedOrgId,
  });

  const { data: courts } = useQuery({
    queryKey: ['/api/facilities', selectedFacilityId, 'courts'],
    enabled: !!selectedFacilityId,
  });

  const { data: userBookings } = useQuery({
    queryKey: ['/api/bookings'],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-gray">Book Your Slot</h1>
        <p className="text-gray-600 mt-1">Find and book available sports facilities</p>
      </div>

      {/* Filters */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-sporty-blue" />
            Find Facilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">Organization</label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                      <Badge variant="secondary" className="ml-2">
                        {org.type}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">Facility</label>
              <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId} disabled={!selectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities?.map((facility: any) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-gray mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sporty-blue focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courts Grid */}
      {courts && courts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courts.map((court: any) => (
            <CourtCard
              key={court.id}
              court={court}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      )}

      {/* My Bookings */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-fresh-green" />
            My Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBookings && userBookings.length > 0 ? (
            <div className="space-y-4">
              {userBookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      booking.status === 'booked' ? 'bg-fresh-green' :
                      booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-dark-gray">Booking #{booking.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={booking.status === 'booked' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No bookings found</p>
              <p className="text-sm text-gray-500 mt-1">Start booking to see your history here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CourtCard({ court, selectedDate }: { court: any; selectedDate: string }) {
  const [showBookingInterface, setShowBookingInterface] = useState(false);

  const { data: slots } = useQuery({
    queryKey: ['/api/courts', court.id, 'slots'],
    queryParams: { date: selectedDate },
  });

  const availableSlots = slots?.filter((slot: any) => {
    // Simple availability check - in real app would check against bookings
    return true;
  }) || [];

  return (
    <>
      <Card className="card-light hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowBookingInterface(true)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{court.name}</CardTitle>
            <Badge variant="outline" className="text-sporty-blue">
              <Users className="h-3 w-3 mr-1" />
              {court.playersRequired} players
            </Badge>
          </div>
          <CardDescription className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Available for booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Slots:</span>
              <span className="font-semibold text-fresh-green">{availableSlots.length} slots</span>
            </div>
            
            {availableSlots.length > 0 && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Next: {availableSlots[0]?.startTime} - {availableSlots[0]?.endTime}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-vibrant-yellow mr-1" />
                <span className="text-sm font-medium">4.8</span>
              </div>
              <Button size="sm" className="btn-primary">
                View Slots
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBookingInterface && (
        <BookingInterface
          court={court}
          selectedDate={selectedDate}
          onClose={() => setShowBookingInterface(false)}
        />
      )}
    </>
  );
}
