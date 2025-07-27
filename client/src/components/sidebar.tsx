import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building,
  MapPin,
  Calendar,
  Bookmark,
  Users,
  Tag,
  Layers,
  CreditCard,
  Bell,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/dashboard", roles: ["app_admin", "org_admin", "staff", "user"] },
  { id: "organizations", label: "Organizations", icon: Building, path: "/organizations", roles: ["app_admin", "org_admin"] },
  { id: "facilities", label: "Facilities & Courts", icon: MapPin, path: "/facilities", roles: ["app_admin", "org_admin", "staff"] },
  { id: "slots", label: "Slot Management", icon: Calendar, path: "/slots", roles: ["app_admin", "org_admin", "staff"] },
  { id: "bookings", label: "Bookings", icon: Bookmark, path: "/booking", roles: ["app_admin", "org_admin", "staff", "user"] },
  { id: "users", label: "User Management", icon: Users, path: "/users", roles: ["app_admin", "org_admin", "staff"] },
  { id: "coupons", label: "Coupons & Discounts", icon: Tag, path: "/coupons", roles: ["app_admin", "org_admin"] },
  { id: "groups", label: "Groups & Sections", icon: Layers, path: "/groups", roles: ["app_admin", "org_admin", "staff"] },
  { id: "payments", label: "Payments", icon: CreditCard, path: "/payments", roles: ["app_admin", "org_admin"] },
  { id: "notifications", label: "Push Notifications", icon: Bell, path: "/notifications", roles: ["app_admin", "org_admin"] },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  if (!userInfo) return null;

  const currentRole = userInfo.currentRole || 'user';
  const availableItems = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <div className="p-6">
        <div className="mb-6">
          <div className="bg-sporty-blue text-white px-3 py-2 rounded-lg text-sm font-medium">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="capitalize">
                {currentRole === 'app_admin' ? 'App Administrator' :
                 currentRole === 'org_admin' ? 'Organization Admin' :
                 currentRole === 'staff' ? 'Staff Member' : 'User'}
              </span>
            </div>
            {userInfo.currentOrgId && (
              <div className="text-xs text-blue-200 mt-1">
                Organization: {userInfo.roles?.find((r: any) => r.orgId === userInfo.currentOrgId)?.orgName}
              </div>
            )}
          </div>
        </div>
        
        <nav className="space-y-2">
          {availableItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-left rounded-lg transition-colors",
                  isActive
                    ? "text-dark-gray bg-blue-50 font-medium"
                    : "text-gray-600 hover:text-dark-gray hover:bg-gray-50"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mr-3",
                  isActive ? "text-sporty-blue" : ""
                )} />
                {item.label}
                {item.id === "bookings" && (
                  <span className="ml-auto bg-fresh-green text-white text-xs px-2 py-1 rounded-full">
                    24
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
