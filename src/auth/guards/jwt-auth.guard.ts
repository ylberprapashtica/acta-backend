import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Get the request object
    const request = context.switchToHttp().getRequest();
    
    // Check if it's an auth route
    if (request.url.startsWith('/auth/')) {
      return true;
    }

    // For all other routes, use JWT authentication
    return super.canActivate(context);
  }
} 