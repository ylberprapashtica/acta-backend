import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from '../user/user.entity';
import * as bcrypt from 'bcrypt';

interface UserWithoutPassword extends Omit<User, 'password'> {}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    console.log('Attempting to validate user:', email);
    const user = await this.userRepository.findOne({ where: { email } });
    console.log('Found user:', user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    } : 'no');
    
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid ? 'yes' : 'no');
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: UserWithoutPassword) {
    console.log('Logging in user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      tenantId: user.tenantId 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      }
    };
  }

  async register(createUserDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId?: string;
    role?: Role;
  }) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || Role.USER,
    });
    
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }
} 