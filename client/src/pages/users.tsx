import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Search, Filter, UserCheck, Mail, Phone, Calendar } from "lucide-react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock users data since we don't have a users endpoint
  const mockUsers = [
    {
      id: "1",
      username: "john_doe",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+91 9876543210",
      gender: "male",
      createdAt: "2024-01-15T10:00:00Z",
      publicUser: true,
    },
    {
      id: "2",
      username: "jane_smith",
      fullName: "Jane Smith",
      email: "jane@example.com",
      phone: "+91 9876543211",
      gender: "female",
      createdAt: "2024-01-16T10:00:00Z",
      publicUser: true,
    },
    {
      id: "3",
      username: "alex_chen",
      fullName: "Alex Chen",
      email: "alex@example.com",
      phone: "+91 9876543212",
      gender: "other",
      createdAt: "2024-01-17T10:00:00Z",
      publicUser: false,
    },
  ];

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || user.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const canManageUsers = ['app_admin', 'org_admin', 'staff'].includes(userInfo?.currentRole || '');

  const genderStats = {
    total: mockUsers.length,
    male: mockUsers.filter(u => u.gender === 'male').length,
    female: mockUsers.filter(u => u.gender === 'female').length,
    other: mockUsers.filter(u => u.gender === 'other').length,
    prefer_not_to_say: mockUsers.filter(u => u.gender === 'prefer_not_to_say').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and their access permissions</p>
        </div>
        {canManageUsers && (
          <Button className="btn-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-dark-gray">{genderStats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-sporty-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Male Users</p>
                <p className="text-2xl font-bold text-dark-gray">{genderStats.male}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-sporty-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Female Users</p>
                <p className="text-2xl font-bold text-dark-gray">{genderStats.female}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Other/Prefer Not</p>
                <p className="text-2xl font-bold text-dark-gray">{genderStats.other + genderStats.prefer_not_to_say}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-sporty-blue" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={genderFilter === "all" ? "default" : "outline"}
                onClick={() => setGenderFilter("all")}
                className={genderFilter === "all" ? "btn-primary" : ""}
              >
                All
              </Button>
              <Button
                variant={genderFilter === "male" ? "default" : "outline"}
                onClick={() => setGenderFilter("male")}
                className={genderFilter === "male" ? "btn-secondary" : ""}
              >
                Male
              </Button>
              <Button
                variant={genderFilter === "female" ? "default" : "outline"}
                onClick={() => setGenderFilter("female")}
                className={genderFilter === "female" ? "bg-pink-500 text-white hover:bg-pink-600" : ""}
              >
                Female
              </Button>
              <Button
                variant={genderFilter === "other" ? "default" : "outline"}
                onClick={() => setGenderFilter("other")}
                className={genderFilter === "other" ? "bg-purple-500 text-white hover:bg-purple-600" : ""}
              >
                Other
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} canManage={canManageUsers} />
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Card className="card-light">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No Users Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || genderFilter !== "all" 
                ? "No users match your search criteria."
                : "No users have registered yet."
              }
            </p>
            {canManageUsers && !searchTerm && genderFilter === "all" && (
              <Button className="btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Invite First User
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gender-Based Groups Info */}
      <Card className="card-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-vibrant-yellow" />
            Gender-Based Grouping
          </CardTitle>
          <CardDescription>
            Users are automatically organized into gender-specific groups for targeted slot access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-sporty-blue">{genderStats.male}</div>
              <div className="text-sm text-gray-600">Male Group</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{genderStats.female}</div>
              <div className="text-sm text-gray-600">Female Group</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{genderStats.other}</div>
              <div className="text-sm text-gray-600">Other Group</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{genderStats.prefer_not_to_say}</div>
              <div className="text-sm text-gray-600">General Group</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            These groups enable targeted slot restrictions for gender-specific tournaments, events, and facilities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function UserCard({ user, canManage }: { user: any; canManage: boolean }) {
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'bg-blue-500';
      case 'female': return 'bg-pink-500';
      case 'other': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getGenderBadge = (gender: string) => {
    switch (gender) {
      case 'male': return <Badge className="bg-blue-500">Male</Badge>;
      case 'female': return <Badge className="bg-pink-500">Female</Badge>;
      case 'other': return <Badge className="bg-purple-500">Other</Badge>;
      case 'prefer_not_to_say': return <Badge variant="secondary">Prefer not to say</Badge>;
      default: return <Badge variant="secondary">Not specified</Badge>;
    }
  };

  return (
    <Card className="card-light hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={`${getGenderColor(user.gender)} text-white`}>
              {user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{user.fullName}</CardTitle>
            <CardDescription>@{user.username}</CardDescription>
          </div>
          {getGenderBadge(user.gender)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{user.email}</span>
          </div>
          
          {user.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{user.phone}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={user.publicUser ? "text-fresh-green border-fresh-green" : "text-orange-500 border-orange-500"}>
              {user.publicUser ? "Public User" : "Private User"}
            </Badge>
          </div>
          
          {canManage && (
            <div className="flex space-x-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1">
                View Profile
              </Button>
              <Button size="sm" className="btn-primary">
                Manage
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
