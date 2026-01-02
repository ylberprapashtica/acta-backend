import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Role } from '../../user/user.entity';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new BadRequestException('User not found in request');
    }
    
    // Get tenantId from user first
    let tenantId = user.tenantId;
    
    // For admin and superadmin, allow tenantId from request body if provided
    const isAdmin = user.role === Role.ADMIN || user.role === 'admin';
    const isSuperAdmin = user.role === Role.SUPERADMIN || user.role === 'super_admin';
    
    if ((isAdmin || isSuperAdmin) && request.body?.tenantId) {
      tenantId = request.body.tenantId;
    }
    
    // For non-admin users, tenantId from user is required
    if (!tenantId && !isSuperAdmin) {
      throw new BadRequestException('Tenant ID is required. User must be assigned to a tenant.');
    }
    
    // Ensure tenantId is a string
    if (tenantId && typeof tenantId !== 'string') {
      throw new BadRequestException('Tenant ID must be a string');
    }
    
    return tenantId;
  },
); 