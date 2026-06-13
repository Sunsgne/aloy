import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "./auth.decorators";

interface LoginBody {
  tenantSlug?: string;
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

@ApiTags("auth")
@Public()
@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginBody) {
    return this.authService.login(body);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshBody) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("logout")
  logout(@Body() body: RefreshBody) {
    return this.authService.logout(body.refreshToken);
  }
}
