import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Skip tenant check for auth routes
    if (request.url.startsWith('/auth/')) {
      return true;
    }

    const user = request.user;

    // Super admins can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // If user has no tenant, they can't access tenant-specific resources
    if (!user.tenantId) {
      return false;
    }

    // Get tenant ID from request
    const requestTenantId = request.params.tenantId || request.body.tenantId;

    // If no tenant ID in request, allow access (tenant-specific endpoints should validate tenant ID)
    if (!requestTenantId) {
      return true;
    }

    // Check if user's tenant matches the requested tenant
    return user.tenantId === requestTenantId;
  }
} 