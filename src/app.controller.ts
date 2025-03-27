import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  async testDatabase() {
    try {
      const userCount = await this.userRepository.count();
      return {
        message: 'Database connection successful',
        userCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database connection error:', error);
      return {
        message: 'Database connection failed',
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }
} 