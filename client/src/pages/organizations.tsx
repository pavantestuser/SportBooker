import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, Plus, Users, MapPin, Edit } from "lucide-react";

export default function Organizations() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const createOrgMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const response = await apiRequest("POST", "/api/organizations", orgData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Organization Created",
        description: "New organization has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const orgData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      createdBy: userInfo?.user?.id,
    };
    createOrgMutation.mutate(orgData);
  };

  const filteredOrganizations = organizations?.filter((org: any) => {
    if (filterType === "all") return true;
    return org.type === filterType;
  }) || [];

  const canCreateOrg = userInfo?.currentRole === 'app_admin';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-dark-gray">Organizations</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage sports organizations and facilities</p>
        </div>
        {canCreateOrg && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Add a new sports organization to the platform
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Downtown Sports Complex"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Organization Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" disabled={createOrgMutation.isPending}>
                    {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" ? "btn-primary" : ""}
        >
          All
        </Button>
        <Button
          variant={filterType === "public" ? "default" : "outline"}
          onClick={() => setFilterType("public")}
          className={filterType === "public" ? "btn-secondary" : ""}
        >
          Public
        </Button>
        <Button
          variant={filterType === "private" ? "default" : "outline"}
          onClick={() => setFilterType("private")}
          className={filterType === "private" ? "btn-accent text-dark-gray" : ""}
        >
          Private
        </Button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org: any) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <Card className="card-light">
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No Organizations Found</h3>
            <p className="text-gray-600 mb-4">
              {filterType === "all" 
                ? "No organizations have been created yet."
                : `No ${filterType} organizations found.`
              }
            </p>
            {canCreateOrg && (
              <Button className="btn-secondary" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Organization
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OrganizationCard({ organization }: { organization: any }) {
  return (
    <Card className="card-light hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-sporty-blue bg-opacity-10 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-sporty-blue" />
            </div>
            <div>
              <CardTitle className="text-lg">{organization.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Organization
              </CardDescription>
            </div>
          </div>
          <Badge variant={organization.type === 'public' ? 'default' : 'secondary'} 
                 className={organization.type === 'public' ? 'bg-fresh-green' : 'bg-purple-600'}>
            {organization.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <Badge variant="outline" className="text-fresh-green border-fresh-green">
              {organization.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Created:</span>
            <span className="text-dark-gray">
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Users className="h-3 w-3 mr-1" />
              Manage
            </Button>
            <Button size="sm" variant="ghost">
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
