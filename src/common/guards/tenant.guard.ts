import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../user/user.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log('TenantGuard - Request URL:', request.url);
    
    // Skip tenant check for auth routes
    if (request.url.startsWith('/auth/')) {
      console.log('TenantGuard - Auth route, skipping check');
      return true;
    }

    const user = request.user;
    console.log('TenantGuard - User:', user);

    // Superadmin has access to everything
    if (user.role === Role.SUPERADMIN || user.role === 'super_admin') {
      console.log('TenantGuard - Superadmin user, allowing access');
      return true;
    }

    // If user has no tenant, they can't access tenant-specific resources
    if (!user.tenantId) {
      console.log('TenantGuard - User has no tenant, denying access');
      return false;
    }

    // Get tenant ID from request
    const requestTenantId = request.params.tenantId || request.body.tenantId;

    // If no tenant ID in request, allow access (tenant-specific endpoints should validate tenant ID)
    if (!requestTenantId) {
      console.log('TenantGuard - No tenant ID in request, allowing access');
      return true;
    }

    // For admin users, they can only access their own tenant
    if (user.role === Role.ADMIN || user.role === 'admin') {
      const hasAccess = user.tenantId === requestTenantId;
      console.log('TenantGuard - Admin tenant check result:', hasAccess);
      return hasAccess;
    }

    // For regular users, they can only access their own tenant
    const hasAccess = user.tenantId === requestTenantId;
    console.log('TenantGuard - Regular user tenant check result:', hasAccess);
    return hasAccess;
  }
} 