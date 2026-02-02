//src/auth/auth.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterIndividualDto, RegisterCompanyDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/individual')
  @ApiOperation({ summary: 'Register a new individual user' })
  @ApiResponse({ status: 201, description: 'Individual registration successful' })
  async registerIndividual(@Body() dto: RegisterIndividualDto) {
    return this.authService.registerIndividual(dto);
  }

  @Post('register/company')
  @ApiOperation({ summary: 'Register a new company user' })
  @ApiResponse({ status: 201, description: 'Company registration successful' })
  async registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get JWT token' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
