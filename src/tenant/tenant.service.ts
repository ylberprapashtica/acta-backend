import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { User, Role } from '../user/user.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getCurrentTenant(userId: string): Promise<Tenant> {
    console.log('Getting current tenant for user:', userId);
    
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['tenant']
    });

    console.log('Found user:', user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    } : 'no');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For superadmin, return all tenants
    if (user.role === Role.SUPERADMIN) {
      console.log('User is superadmin, getting all tenants');
      const tenants = await this.tenantRepository.find({
        relations: ['companies']
      });
      
      if (tenants.length === 0) {
        console.log('No tenants found, creating default tenant');
        const defaultTenant = await this.create({
          name: 'Default Tenant',
          slug: 'default',
          description: 'Default tenant for superadmin'
        });
        return defaultTenant;
      }
      
      // Return the first tenant as default for superadmin
      return tenants[0];
    }

    // For other users, return their assigned tenant
    if (!user.tenant) {
      console.log('User has no tenant assigned');
      throw new NotFoundException('No tenant assigned to user');
    }

    // Load the tenant with companies
    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenant.id },
      relations: ['companies']
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    console.log('Returning user tenant:', tenant);
    return tenant;
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create(createTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['companies']
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ 
      where: { id },
      relations: ['companies']
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }
} 