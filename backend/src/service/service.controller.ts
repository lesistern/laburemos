import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Services')
@Controller('api/services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Roles(UserType.FREELANCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Freelancer role required',
  })
  create(
    @CurrentUser() user: any,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.serviceService.create(user.sub, createServiceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all services with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'freelancerId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'priceType', required: false, enum: ['FIXED', 'HOURLY', 'CUSTOM'] })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, example: 10000 })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, example: 100000 })
  @ApiQuery({ name: 'maxDeliveryTime', required: false, type: Number, example: 7 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'website' })
  @ApiQuery({ name: 'tags', required: false, type: String, example: 'react,nodejs' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['title', 'basePrice', 'deliveryTime', 'ratingAverage', 'orderCount', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() query: ServiceQueryDto) {
    return this.serviceService.findAll(query);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured services' })
  @ApiResponse({
    status: 200,
    description: 'Featured services retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 8, description: 'Maximum number of featured services to return' })
  findFeatured(@Query('limit', ParseIntPipe) limit?: number) {
    return this.serviceService.findFeatured(limit);
  }

  @Get('freelancer/:freelancerId')
  @Public()
  @ApiOperation({ summary: 'Get services by freelancer' })
  @ApiParam({
    name: 'freelancerId',
    type: 'number',
    description: 'Freelancer ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Freelancer services retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Freelancer not found',
  })
  findByFreelancer(
    @Param('freelancerId', ParseIntPipe) freelancerId: number,
    @Query() query: ServiceQueryDto,
  ) {
    return this.serviceService.findByFreelancer(freelancerId, query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Service ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserType.FREELANCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Service ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own services',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.serviceService.update(id, user.sub, updateServiceDto);
  }

  @Delete(':id')
  @Roles(UserType.FREELANCER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Service ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Service deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - service has active projects',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete own services',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.serviceService.remove(id, user.sub);
  }
}