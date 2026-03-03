//RentAnything-Backend/src/auth/auth.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterIndividualDto, RegisterCompanyDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CheckEmailDto } from './dto/check-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if email is available' })
  @ApiResponse({ status: 200, description: 'Email is available' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto);
  }

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

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOtp(@Body() dto: { phone: string }) {
    return this.authService.resendOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get JWT token' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('login-guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as a guest' })
  @ApiResponse({ status: 200, description: 'Guest login successful' })
  async loginGuest() {
    return this.authService.loginGuest();
  }
}
