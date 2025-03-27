import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../user/user.entity';
import { Request } from 'express';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  tenantId?: string;
}

@Controller('tenants')
@UseGuards(RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {
    console.log('TenantController initialized');
  }

  @Get('current')
  @Roles(Role.ADMIN, Role.USER)
  async getCurrentTenant(@Req() req: Request) {
    console.log('TenantController - getCurrentTenant called');
    console.log('TenantController - Request user:', req.user);
    console.log('TenantController - User role:', (req.user as JwtPayload)?.role);
    
    const user = req.user as JwtPayload;
    if (!user?.id) {
      console.log('TenantController - No user ID found in request');
      throw new Error('User ID not found in request');
    }
    
    console.log('TenantController - Getting current tenant for user:', user.id);
    return this.tenantService.getCurrentTenant(user.id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
} 