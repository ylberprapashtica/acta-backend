import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenant/tenant.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // For admin users, check if the requested tenant is part of their tenant group
    if (user.role === Role.ADMIN || user.role === 'admin') {
      const userTenant = await this.tenantRepository.findOne({
        where: { id: user.tenantId }
      });

      if (!userTenant) {
        console.log('TenantGuard - Admin user tenant not found');
        return false;
      }

      // If the requested tenant is the same as the admin's tenant, allow access
      if (requestTenantId === user.tenantId) {
        console.log('TenantGuard - Admin accessing their own tenant');
        return true;
      }

      // Check if the requested tenant is part of the admin's tenant group
      const requestedTenant = await this.tenantRepository.findOne({
        where: { id: requestTenantId }
      });

      if (!requestedTenant) {
        console.log('TenantGuard - Requested tenant not found');
        return false;
      }

      // For now, we'll only allow access to the admin's own tenant
      // If you want to implement tenant groups later, you can add that logic here
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