import { storage } from "../storage";
import bcrypt from "bcrypt";

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async getUserWithRoles(userId: string) {
    const user = await storage.getUser(userId);
    if (!user) return null;

    const roles = await storage.getUserRoles(userId);
    return { user, roles };
  }

  async canUserAccessOrganization(userId: string, orgId: string): Promise<boolean> {
    const roles = await storage.getUserRoles(userId);
    
    // App admins can access all organizations
    if (roles.some(r => r.role === 'app_admin')) {
      return true;
    }

    // Check if user has specific org access
    return roles.some(r => r.orgId === orgId);
  }

  async canUserPerformAction(userId: string, action: string, orgId?: string): Promise<boolean> {
    const roles = await storage.getUserRoles(userId);
    
    // App admin can do everything
    if (roles.some(r => r.role === 'app_admin')) {
      return true;
    }

    // Organization-specific actions
    if (orgId) {
      const orgRoles = roles.filter(r => r.orgId === orgId);
      
      switch (action) {
        case 'manage_organization':
          return orgRoles.some(r => r.role === 'org_admin');
        case 'manage_facilities':
        case 'manage_courts':
        case 'create_slots':
          return orgRoles.some(r => ['org_admin', 'staff'].includes(r.role));
        case 'book_slots':
          return true; // All users can book
        default:
          return false;
      }
    }

    return false;
  }
}

export const authService = new AuthService();
