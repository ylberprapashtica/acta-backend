import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../user/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT payload:', payload);
    
    // Convert role string to Role enum if needed
    let role = payload.role;
    if (typeof role === 'string') {
      if (role === 'super_admin') {
        role = Role.SUPERADMIN;
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: role,
      tenantId: payload.tenantId,
    };
  }
} 