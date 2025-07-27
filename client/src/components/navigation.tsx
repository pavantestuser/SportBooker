import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dumbbell, Bell, User, LogOut } from "lucide-react";
import RoleSwitcher from "./role-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navigation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!userInfo) return null;

  return (
    <nav className="bg-sporty-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Dumbbell className="text-white text-2xl mr-2" />
              <span className="text-white text-xl font-bold">SportBook Pro</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Role Switcher */}
            <RoleSwitcher />
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-white hover:text-vibrant-yellow hover:bg-blue-600">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-vibrant-yellow text-dark-gray rounded-full text-xs w-5 h-5 flex items-center justify-center font-semibold">
                3
              </span>
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-white hover:text-vibrant-yellow hover:bg-blue-600">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-white text-sporty-blue">
                      {userInfo.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{userInfo.user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userInfo.user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userInfo.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
