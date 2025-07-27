import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Plus, Building2, Users, Calendar } from "lucide-react";

export default function Facilities() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isFacilityDialogOpen, setIsFacilityDialogOpen] = useState(false);
  const [isCourtDialogOpen, setIsCourtDialogOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: facilities } = useQuery({
    queryKey: ['/api/organizations', selectedOrgId, 'facilities'],
    enabled: !!selectedOrgId,
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const createFacilityMutation = useMutation({
    mutationFn: async (facilityData: any) => {
      const response = await apiRequest("POST", "/api/facilities", facilityData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', selectedOrgId, 'facilities'] });
      setIsFacilityDialogOpen(false);
      toast({
        title: "Facility Created",
        description: "New facility has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create facility",
        variant: "destructive",
      });
    },
  });

  const createCourtMutation = useMutation({
    mutationFn: async (courtData: any) => {
      const response = await apiRequest("POST", "/api/courts", courtData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facilities', selectedFacilityId, 'courts'] });
      setIsCourtDialogOpen(false);
      toast({
        title: "Court Created",
        description: "New court has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create court",
        variant: "destructive",
      });
    },
  });

  const handleCreateFacility = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const facilityData = {
      orgId: selectedOrgId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };
    createFacilityMutation.mutate(facilityData);
  };

  const handleCreateCourt = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const courtData = {
      facilityId: selectedFacilityId,
      name: formData.get('name') as string,
      playersRequired: parseInt(formData.get('playersRequired') as string),
      availableToPublic: formData.get('availableToPublic') === 'true',
    };
    createCourtMutation.mutate(courtData);
  };

  const canManageFacilities = ['app_admin', 'org_admin', 'staff'].includes(userInfo?.currentRole || '');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">Facilities & Courts</h1>
          <p className="text-gray-600 mt-1">Manage sports facilities and courts</p>
        </div>
        {canManageFacilities && (
          <div className="flex space-x-2">
            <Dialog open={isFacilityDialogOpen} onOpenChange={setIsFacilityDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-secondary" disabled={!selectedOrgId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Facility
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Facility</DialogTitle>
                  <DialogDescription>
                    Add a new sports facility to the organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFacility} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Facility Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Main Sports Complex"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Multi-purpose sports facility with modern amenities"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsFacilityDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="btn-primary" disabled={createFacilityMutation.isPending}>
                      {createFacilityMutation.isPending ? "Creating..." : "Create Facility"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Organization Selector */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-sporty-blue" />
            Select Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="organization">Organization</Label>
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
            {selectedOrgId && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{facilities?.length || 0}</span> facilities found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Facilities Grid */}
      {selectedOrgId && facilities && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facilities.map((facility: any) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onSelectForCourt={() => {
                setSelectedFacilityId(facility.id);
                setIsCourtDialogOpen(true);
              }}
              canManage={canManageFacilities}
            />
          ))}
        </div>
      )}

      {selectedOrgId && facilities?.length === 0 && (
        <Card className="card-light">
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No Facilities Found</h3>
            <p className="text-gray-600 mb-4">
              No facilities have been created for this organization yet.
            </p>
            {canManageFacilities && (
              <Button className="btn-secondary" onClick={() => setIsFacilityDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Facility
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Court Dialog */}
      <Dialog open={isCourtDialogOpen} onOpenChange={setIsCourtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Court</DialogTitle>
            <DialogDescription>
              Add a new court to the facility
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourt} className="space-y-4">
            <div>
              <Label htmlFor="courtName">Court Name</Label>
              <Input
                id="courtName"
                name="name"
                placeholder="Court A - Basketball"
                required
              />
            </div>
            <div>
              <Label htmlFor="playersRequired">Players Required</Label>
              <Input
                id="playersRequired"
                name="playersRequired"
                type="number"
                placeholder="10"
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="availableToPublic">Availability</Label>
              <Select name="availableToPublic" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available to Public</SelectItem>
                  <SelectItem value="false">Private/Members Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCourtDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" disabled={createCourtMutation.isPending}>
                {createCourtMutation.isPending ? "Creating..." : "Create Court"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FacilityCard({ facility, onSelectForCourt, canManage }: { 
  facility: any; 
  onSelectForCourt: () => void;
  canManage: boolean;
}) {
  const { data: courts } = useQuery({
    queryKey: ['/api/facilities', facility.id, 'courts'],
  });

  return (
    <Card className="card-light">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{facility.name}</CardTitle>
            <CardDescription className="mt-1">
              {facility.description || "Sports facility"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sporty-blue">
              <MapPin className="h-3 w-3 mr-1" />
              Facility
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-sporty-blue">{courts?.length || 0}</div>
              <div className="text-xs text-gray-600">Courts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-fresh-green">
                {courts?.filter((c: any) => c.availableToPublic).length || 0}
              </div>
              <div className="text-xs text-gray-600">Public</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-vibrant-yellow">24</div>
              <div className="text-xs text-gray-600">Bookings</div>
            </div>
          </div>

          {/* Courts List */}
          {courts && courts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-dark-gray">Courts:</h4>
              <div className="space-y-1">
                {courts.slice(0, 3).map((court: any) => (
                  <div key={court.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{court.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" size="sm">
                        <Users className="h-3 w-3 mr-1" />
                        {court.playersRequired}
                      </Badge>
                      {court.availableToPublic && (
                        <Badge variant="secondary" size="sm" className="bg-fresh-green text-white">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {courts.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{courts.length - 3} more courts
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Calendar className="h-3 w-3 mr-1" />
              View Schedule
            </Button>
            {canManage && (
              <Button size="sm" className="btn-primary" onClick={onSelectForCourt}>
                <Plus className="h-3 w-3 mr-1" />
                Add Court
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
