import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  gender?: string;
}

export interface UserRole {
  role: string;
  orgId?: string;
  orgName?: string;
}

export interface AuthState {
  user: User | null;
  roles: UserRole[];
  currentRole: string;
  currentOrgId?: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<AuthState> {
    try {
      const response = await apiRequest("POST", "/api/login", { email, password });
      const data = await response.json();
      
      return {
        user: data.user,
        roles: data.roles,
        currentRole: data.currentRole,
        currentOrgId: data.currentOrgId,
      };
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  }

  async register(userData: {
    username: string;
    fullName: string;
    email: string;
    phone?: string;
    gender?: string;
    password: string;
  }): Promise<{ message: string; userId: string }> {
    try {
      const response = await apiRequest("POST", "/api/register", {
        ...userData,
        passwordHash: userData.password,
      });
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  }

  async logout(): Promise<void> {
    try {
      await apiRequest("POST", "/api/logout");
    } catch (error) {
      throw new Error(error.message || "Logout failed");
    }
  }

  async getCurrentUser(): Promise<AuthState | null> {
    try {
      const response = await apiRequest("GET", "/api/me");
      const data = await response.json();
      
      return {
        user: data.user,
        roles: data.roles,
        currentRole: data.currentRole,
        currentOrgId: data.currentOrgId,
      };
    } catch (error) {
      if (error.message.includes("401")) {
        return null; // User not authenticated
      }
      throw error;
    }
  }

  async switchRole(role: string, orgId?: string): Promise<AuthState> {
    try {
      const response = await apiRequest("POST", "/api/switch-role", { role, orgId });
      const data = await response.json();
      
      // Return the current auth state after role switch
      return await this.getCurrentUser() as AuthState;
    } catch (error) {
      throw new Error(error.message || "Role switch failed");
    }
  }

  // Helper methods for role-based access control
  hasRole(authState: AuthState | null, role: string): boolean {
    if (!authState) return false;
    return authState.roles.some(r => r.role === role);
  }

  hasOrgRole(authState: AuthState | null, role: string, orgId: string): boolean {
    if (!authState) return false;
    return authState.roles.some(r => r.role === role && r.orgId === orgId);
  }

  canAccessOrganization(authState: AuthState | null, orgId: string): boolean {
    if (!authState) return false;
    
    // App admins can access all organizations
    if (this.hasRole(authState, 'app_admin')) return true;
    
    // Check if user has specific org access
    return authState.roles.some(r => r.orgId === orgId);
  }

  canManageFacilities(authState: AuthState | null, orgId?: string): boolean {
    if (!authState) return false;
    
    const currentRole = authState.currentRole;
    const currentOrgId = authState.currentOrgId;
    
    if (currentRole === 'app_admin') return true;
    
    if (orgId && orgId !== currentOrgId) return false;
    
    return ['org_admin', 'staff'].includes(currentRole);
  }

  canCreateSlots(authState: AuthState | null, orgId?: string): boolean {
    if (!authState) return false;
    
    const currentRole = authState.currentRole;
    const currentOrgId = authState.currentOrgId;
    
    if (currentRole === 'app_admin') return true;
    
    if (orgId && orgId !== currentOrgId) return false;
    
    return ['org_admin', 'staff'].includes(currentRole);
  }

  canManageCoupons(authState: AuthState | null): boolean {
    if (!authState) return false;
    return ['app_admin', 'org_admin'].includes(authState.currentRole);
  }

  canManageUsers(authState: AuthState | null): boolean {
    if (!authState) return false;
    return ['app_admin', 'org_admin', 'staff'].includes(authState.currentRole);
  }

  isAuthenticated(authState: AuthState | null): boolean {
    return authState !== null && authState.user !== null;
  }

  // Get user display name
  getUserDisplayName(authState: AuthState | null): string {
    if (!authState?.user) return "Guest";
    return authState.user.fullName || authState.user.username;
  }

  // Get current role display name
  getRoleDisplayName(authState: AuthState | null): string {
    if (!authState) return "Guest";
    
    const role = authState.currentRole;
    const orgRole = authState.roles.find(r => r.role === role && r.orgId === authState.currentOrgId);
    
    switch (role) {
      case 'app_admin':
        return 'App Administrator';
      case 'org_admin':
        return orgRole?.orgName ? `Org Admin - ${orgRole.orgName}` : 'Organization Admin';
      case 'staff':
        return orgRole?.orgName ? `Staff - ${orgRole.orgName}` : 'Staff Member';
      case 'user':
        return 'User';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }
}

export const authService = AuthService.getInstance();
