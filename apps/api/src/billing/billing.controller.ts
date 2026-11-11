import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("api/v1/workspaces/:id")
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("usage")
  async getUsage(@Param("id") workspaceId: string) {
    return this.billingService.getUsage(workspaceId);
  }

  @Get("billing")
  async getBillingStatus(@Param("id") workspaceId: string) {
    return this.billingService.getBillingStatus(workspaceId);
  }
}
