import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    // Check if tenant with same slug already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: createTenantDto.slug }
    });

    if (existingTenant) {
      throw new ForbiddenException('A tenant with this slug already exists');
    }

    const tenant = this.tenantRepository.create(createTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async findAll(userId: string): Promise<Tenant[]> {
    console.log('TenantService - findAll called with userId:', userId);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      console.log('TenantService - User not found');
      throw new NotFoundException('User not found');
    }

    console.log('TenantService - User role:', user.role);
    
    if (user.role === Role.SUPERADMIN) {
      console.log('TenantService - User is superadmin, returning all tenants');
      return this.tenantRepository.find();
    }

    if (!user.tenantId) {
      console.log('TenantService - User has no assigned tenant');
      throw new NotFoundException('User has no assigned tenant');
    }

    console.log('TenantService - Returning tenant for non-superadmin user');
    const tenant = await this.tenantRepository.findOne({ 
      where: { id: user.tenantId } 
    });

    if (!tenant) {
      console.log('TenantService - Tenant not found');
      throw new NotFoundException('Tenant not found');
    }

    return [tenant];
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

    // If slug is being updated, check if new slug is already taken
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { slug: updateTenantDto.slug }
      });

      if (existingTenant) {
        throw new ForbiddenException('A tenant with this slug already exists');
      }
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    
    // Check if tenant has any users
    const userCount = await this.userRepository.count({
      where: { tenantId: id }
    });

    if (userCount > 0) {
      throw new ForbiddenException('Cannot delete tenant with existing users');
    }

    await this.tenantRepository.remove(tenant);
  }
} 