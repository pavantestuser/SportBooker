import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck } from "lucide-react";

export default function RoleSwitcher() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery({
    queryKey: ['/api/me'],
  });

  const switchRoleMutation = useMutation({
    mutationFn: async ({ role, orgId }: { role: string; orgId?: string }) => {
      const response = await apiRequest("POST", "/api/switch-role", { role, orgId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Role Switched",
        description: `Now acting as ${data.currentRole.replace('_', ' ')}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Role Switch Failed",
        description: error.message || "Failed to switch role",
        variant: "destructive",
      });
    },
  });

  if (!userInfo?.roles || userInfo.roles.length <= 1) {
    return null;
  }

  const handleRoleChange = (value: string) => {
    const [role, orgId] = value.split('|');
    switchRoleMutation.mutate({ role, orgId: orgId || undefined });
  };

  const getCurrentRoleValue = () => {
    const currentRole = userInfo.currentRole;
    const currentOrgId = userInfo.currentOrgId;
    return currentOrgId ? `${currentRole}|${currentOrgId}` : currentRole;
  };

  const getRoleLabel = (role: any) => {
    switch (role.role) {
      case 'app_admin':
        return 'App Admin';
      case 'org_admin':
        return `Org Admin - ${role.orgName}`;
      case 'staff':
        return `Staff - ${role.orgName}`;
      case 'user':
        return 'User';
      default:
        return role.role;
    }
  };

  return (
    <div className="relative">
      <Select
        value={getCurrentRoleValue()}
        onValueChange={handleRoleChange}
        disabled={switchRoleMutation.isPending}
      >
        <SelectTrigger className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm border-none focus:ring-2 focus:ring-vibrant-yellow hover:bg-blue-700">
          <div className="flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {userInfo.roles.map((role: any, index: number) => {
            const value = role.orgId ? `${role.role}|${role.orgId}` : role.role;
            return (
              <SelectItem key={index} value={value}>
                {getRoleLabel(role)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
