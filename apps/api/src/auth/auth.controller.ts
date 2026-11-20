import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
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
  @Get("github")
  githubAuth(@Res() res: any) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException("GitHub OAuth credentials not configured on this server");
    }
    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ||
      "https://mocklab-api-prod.onrender.com/api/v1/auth/github/callback";
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user:email`;
    return res.redirect(authUrl);
  }

  @Public()
  @Get("github/callback")
  async githubCallback(@Query("code") code: string, @Res() res: any) {
    if (!code) {
      throw new BadRequestException("Missing GitHub authorization code");
    }
    const result = await this.authService.loginWithGitHub(code);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mocklab-theta.vercel.app").replace(/\/+$/, "");
    const redirectUrl = `${appUrl}/auth/callback?token=${encodeURIComponent(
      result.token
    )}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    return res.redirect(redirectUrl);
  }

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
