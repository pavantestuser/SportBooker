import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Filter } from "lucide-react";
import SlotCreationForm from "@/components/slot-creation-form";

export default function Slots() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");
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

  const { data: slots } = useQuery({
    queryKey: ['/api/courts', selectedCourtId, 'slots'],
    queryParams: { date: selectedDate },
    enabled: !!selectedCourtId,
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const canCreateSlots = ['app_admin', 'org_admin', 'staff'].includes(userInfo?.currentRole || '');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-gray">Slot Management</h1>
        <p className="text-gray-600 mt-1">Create and manage booking slots with advanced restrictions</p>
      </div>

      {/* Filters */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-sporty-blue" />
            Filter Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium text-dark-gray mb-2">Court</label>
              <Select value={selectedCourtId} onValueChange={setSelectedCourtId} disabled={!selectedFacilityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Court" />
                </SelectTrigger>
                <SelectContent>
                  {courts?.map((court: any) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot Creation Form */}
        {canCreateSlots && (
          <div className="lg:col-span-2">
            <SlotCreationForm />
          </div>
        )}

        {/* Existing Slots */}
        <div className="space-y-6">
          <Card className="card-light">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-fresh-green" />
                Existing Slots
              </CardTitle>
              <CardDescription>
                {selectedDate ? `Slots for ${new Date(selectedDate).toLocaleDateString()}` : 'Select a date to view slots'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots && slots.length > 0 ? (
                <div className="space-y-3">
                  {slots.map((slot: any) => (
                    <SlotCard key={slot.id} slot={slot} />
                  ))}
                </div>
              ) : selectedCourtId ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No slots found for selected criteria</p>
                  {canCreateSlots && (
                    <p className="text-sm text-gray-500 mt-1">Create slots using the form on the left</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select organization, facility, and court to view slots</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slot Statistics */}
          {selectedCourtId && (
            <Card className="card-light">
              <CardHeader>
                <CardTitle className="text-lg">Slot Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sporty-blue">{slots?.length || 0}</div>
                    <div className="text-xs text-gray-600">Total Slots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-fresh-green">
                      {slots?.filter((s: any) => !s.restrictionId).length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Open Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-vibrant-yellow">
                      {slots?.filter((s: any) => s.restrictionId).length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Restricted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-xs text-gray-600">Booked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotCard({ slot }: { slot: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-fresh-green rounded-full"></div>
        <div>
          <p className="text-sm font-medium text-dark-gray">
            {slot.startTime} - {slot.endTime}
          </p>
          <p className="text-xs text-gray-600">
            ₹{slot.price} • Max {slot.maxBookings} bookings
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {slot.restrictionId && (
          <Badge variant="outline" className="text-vibrant-yellow border-vibrant-yellow">
            Restricted
          </Badge>
        )}
        <Badge variant="secondary" className="bg-fresh-green text-white">
          Available
        </Badge>
      </div>
    </div>
  );
}
