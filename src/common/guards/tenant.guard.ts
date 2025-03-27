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

    // Superadmin and Admin can access everything
    if (user.role === Role.SUPERADMIN || user.role === Role.ADMIN || user.role === 'super_admin') {
      console.log('TenantGuard - Superadmin/Admin user, allowing access');
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

    // Check if user's tenant matches the requested tenant
    const hasAccess = user.tenantId === requestTenantId;
    console.log('TenantGuard - Tenant check result:', hasAccess);
    return hasAccess;
  }
} 