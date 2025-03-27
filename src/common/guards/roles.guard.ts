import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../user/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard - User:', user);
    console.log('RolesGuard - User role:', user.role);
    console.log('RolesGuard - Role.SUPERADMIN:', Role.SUPERADMIN);
    
    // Superadmin has access to everything - check both string and enum
    const isSuperAdmin = user.role === Role.SUPERADMIN || user.role === 'super_admin';
    console.log('RolesGuard - Is superadmin?', isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('RolesGuard - User is superadmin, allowing access');
      return true;
    }

    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    console.log('RolesGuard - Required roles:', requiredRoles);
    
    if (!requiredRoles) {
      console.log('RolesGuard - No roles required, allowing access');
      return true;
    }

    // For superadmin, always allow access regardless of required roles
    if (user.role === 'super_admin') {
      console.log('RolesGuard - User is super_admin, allowing access');
      return true;
    }

    // If Role.USER is required, also allow ADMIN access
    if (requiredRoles.includes(Role.USER) && user.role === Role.ADMIN) {
      console.log('RolesGuard - User is admin and Role.USER is required, allowing access');
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    console.log('RolesGuard - User has required role:', hasRole);
    return hasRole;
  }
} 