import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard, Public } from "./auth.guard";
import {
  UserSignupSchema,
  UserLoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "@mocklab/shared";

@Controller("api/v1/auth")
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() body: unknown) {
    const parseResult = UserSignupSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.authService.signup(parseResult.data);
  }

  @Public()
  @Post("login")
  async login(@Body() body: unknown) {
    const parseResult = UserLoginSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.authService.login(parseResult.data);
  }

  @Get("me")
  async getMe(@Req() req: { user: { userId: string } }) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @Patch("profile")
  async updateProfile(@Req() req: { user: { userId: string } }, @Body() body: unknown) {
    const parseResult = UpdateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.authService.updateProfile(req.user.userId, parseResult.data);
  }

  @Post("password")
  async changePassword(@Req() req: { user: { userId: string } }, @Body() body: unknown) {
    const parseResult = ChangePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors.map((e) => e.message).join(", "));
    }
    return this.authService.changePassword(
      req.user.userId,
      parseResult.data.currentPassword,
      parseResult.data.newPassword
    );
  }
}
