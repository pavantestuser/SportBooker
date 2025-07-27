import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Users, Shield, Clock, Calendar } from "lucide-react";

export default function SlotCreationForm() {
  const [formData, setFormData] = useState({
    courtId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    price: "",
    maxBookings: "1",
    restrictionId: "",
    // Restriction settings
    restrictedGroups: [] as string[],
    onePerUserPerDay: false,
    allowFullCourt: false,
    maxCombinableSlots: "1",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: slotRestrictions } = useQuery({
    queryKey: ['/api/slot-restrictions'],
  });

  const createSlotMutation = useMutation({
    mutationFn: async (slotData: any) => {
      const response = await apiRequest("POST", "/api/slots", slotData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courts'] });
      toast({
        title: "Slot Created",
        description: "New slot has been successfully created with restrictions.",
      });
      // Reset form
      setFormData({
        courtId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        price: "",
        maxBookings: "1",
        restrictionId: "",
        restrictedGroups: [],
        onePerUserPerDay: false,
        allowFullCourt: false,
        maxCombinableSlots: "1",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create slot",
        variant: "destructive",
      });
    },
  });

  const createRestrictionMutation = useMutation({
    mutationFn: async (restrictionData: any) => {
      const response = await apiRequest("POST", "/api/slot-restrictions", restrictionData);
      return response.json();
    },
    onSuccess: (newRestriction) => {
      queryClient.invalidateQueries({ queryKey: ['/api/slot-restrictions'] });
      // Use the new restriction for the slot
      const slotData = {
        courtId: formData.courtId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        price: formData.price,
        maxBookings: parseInt(formData.maxBookings),
        restrictionId: newRestriction.id,
      };
      createSlotMutation.mutate(slotData);
    },
    onError: (error: any) => {
      toast({
        title: "Restriction Creation Failed",
        description: error.message || "Failed to create slot restriction",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courtId || !formData.startTime || !formData.endTime || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if we need to create a new restriction
    const hasRestrictions = formData.restrictedGroups.length > 0 || 
                           formData.onePerUserPerDay || 
                           formData.allowFullCourt || 
                           parseInt(formData.maxCombinableSlots) > 1;

    if (hasRestrictions && !formData.restrictionId) {
      // Create new restriction first
      const restrictionData = {
        name: `Restriction for ${formData.date} ${formData.startTime}-${formData.endTime}`,
        restrictedGroups: formData.restrictedGroups,
        onePerUserPerDay: formData.onePerUserPerDay,
        allowFullCourt: formData.allowFullCourt,
        maxCombinableSlots: parseInt(formData.maxCombinableSlots),
      };
      createRestrictionMutation.mutate(restrictionData);
    } else {
      // Create slot directly
      const slotData = {
        courtId: formData.courtId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        price: formData.price,
        maxBookings: parseInt(formData.maxBookings),
        restrictionId: formData.restrictionId || null,
      };
      createSlotMutation.mutate(slotData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupToggle = (groupName: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        restrictedGroups: [...prev.restrictedGroups, groupName]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        restrictedGroups: prev.restrictedGroups.filter(g => g !== groupName)
      }));
    }
  };

  // Mock court data - in real app this would come from API
  const mockCourts = [
    { id: "1", name: "Court A - Basketball", facilityName: "Main Complex" },
    { id: "2", name: "Court B - Tennis", facilityName: "Tennis Center" },
    { id: "3", name: "Court C - Badminton", facilityName: "Indoor Sports" },
  ];

  // Mock groups - in real app this would come from API
  const availableGroups = [
    "All Users",
    "VIP Members",
    "Students",
    "Corporate Members",
    "Women Only",
    "Men Only",
    "Seniors (60+)",
    "Youth (Under 18)",
  ];

  return (
    <Card className="card-light">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-sporty-blue" />
              Create New Slot
            </CardTitle>
            <CardDescription>Create slots with advanced booking restrictions</CardDescription>
          </div>
          <Badge className="bg-fresh-green">Advanced</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Slot Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-gray border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="court">Court Selection *</Label>
                <Select value={formData.courtId} onValueChange={(value) => handleInputChange("courtId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Court" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name} - {court.facilityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxBookings">Maximum Bookings</Label>
              <Input
                id="maxBookings"
                type="number"
                value={formData.maxBookings}
                onChange={(e) => handleInputChange("maxBookings", e.target.value)}
                placeholder="1"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of users who can book this slot</p>
            </div>
          </div>

          {/* Advanced Restrictions */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-sporty-blue" />
              <h3 className="text-lg font-semibold text-dark-gray">🎯 Slot Restrictions</h3>
            </div>

            {/* Existing Restrictions */}
            <div>
              <Label htmlFor="existingRestriction">Use Existing Restriction (Optional)</Label>
              <Select value={formData.restrictionId} onValueChange={(value) => handleInputChange("restrictionId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No existing restriction</SelectItem>
                  {slotRestrictions?.map((restriction: any) => (
                    <SelectItem key={restriction.id} value={restriction.id}>
                      {restriction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group-Based Access */}
            <div>
              <Label className="flex items-center space-x-2 mb-3">
                <Users className="h-4 w-4 text-sporty-blue" />
                <span>Group-Based Access Restriction</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {availableGroups.map((group) => (
                  <div key={group} className="flex items-center space-x-2">
                    <Checkbox
                      id={group}
                      checked={formData.restrictedGroups.includes(group)}
                      onCheckedChange={(checked) => handleGroupToggle(group, !!checked)}
                    />
                    <Label htmlFor={group} className="text-sm">{group}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select groups that can access this slot</p>
            </div>

            {/* Booking Restrictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onePerDay"
                    checked={formData.onePerUserPerDay}
                    onCheckedChange={(checked) => handleInputChange("onePerUserPerDay", !!checked)}
                  />
                  <Label htmlFor="onePerDay" className="text-sm font-medium">
                    ✅ One slot per user per day
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fullCourt"
                    checked={formData.allowFullCourt}
                    onCheckedChange={(checked) => handleInputChange("allowFullCourt", !!checked)}
                  />
                  <Label htmlFor="fullCourt" className="text-sm font-medium">
                    🏟️ Allow full court booking
                  </Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="maxCombinableSlots">Max Combinable Slots</Label>
                <Select 
                  value={formData.maxCombinableSlots} 
                  onValueChange={(value) => handleInputChange("maxCombinableSlots", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">No combination allowed</SelectItem>
                    <SelectItem value="2">Max 2 consecutive slots</SelectItem>
                    <SelectItem value="3">Max 3 consecutive slots</SelectItem>
                    <SelectItem value="4">Max 4 consecutive slots</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Allow booking multiple consecutive time slots</p>
              </div>
            </div>

            {/* Restriction Preview */}
            {(formData.restrictedGroups.length > 0 || formData.onePerUserPerDay || formData.allowFullCourt || parseInt(formData.maxCombinableSlots) > 1) && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-dark-gray mb-2">Active Restrictions:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.restrictedGroups.map((group) => (
                    <Badge key={group} variant="outline" className="text-sporty-blue border-sporty-blue">
                      {group}
                    </Badge>
                  ))}
                  {formData.onePerUserPerDay && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      One per day
                    </Badge>
                  )}
                  {formData.allowFullCourt && (
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      Full court allowed
                    </Badge>
                  )}
                  {parseInt(formData.maxCombinableSlots) > 1 && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {formData.maxCombinableSlots} slot combo
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={createSlotMutation.isPending || createRestrictionMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createSlotMutation.isPending || createRestrictionMutation.isPending ? "Creating..." : "Create Slot"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
