import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ScenariosService } from "./scenarios.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@Controller("api/v1/projects/:id/scenarios")
@UseGuards(AuthGuard, RolesGuard)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  async getOverview(
    @Param("id") projectId: string,
    @Query("scenarioKey") scenarioKey?: string
  ) {
    return this.scenariosService.getOverview(projectId, scenarioKey || "default");
  }

  @Get("buckets/:resource")
  async listBucketItems(
    @Param("id") projectId: string,
    @Param("resource") resource: string,
    @Query("scenarioKey") scenarioKey?: string,
    @Query("search") search?: string
  ) {
    return this.scenariosService.listBucketItems(
      projectId,
      resource,
      scenarioKey || "default",
      search
    );
  }

  @Delete("buckets/:resource/:itemId")
  @HttpCode(HttpStatus.OK)
  async deleteBucketItem(
    @Param("id") projectId: string,
    @Param("resource") resource: string,
    @Param("itemId") itemId: string,
    @Query("scenarioKey") scenarioKey?: string
  ) {
    return this.scenariosService.deleteBucketItem(
      projectId,
      resource,
      itemId,
      scenarioKey || "default"
    );
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  async resetProjectState(
    @Param("id") projectId: string,
    @Body() body: { scenarioKey?: string }
  ) {
    return this.scenariosService.resetProjectState(projectId, body?.scenarioKey);
  }

  @Post("templates")
  @HttpCode(HttpStatus.OK)
  async applyTemplate(
    @Param("id") projectId: string,
    @Body() body: { template: "orders" | "crud" | "auth"; resource?: string; scenarioKey?: string }
  ) {
    return this.scenariosService.applyTemplate(
      projectId,
      body.scenarioKey || "default",
      body.template,
      body.resource
    );
  }

  @Post("transition")
  @HttpCode(HttpStatus.OK)
  async transitionState(
    @Param("id") projectId: string,
    @Body() body: { scenarioName: string; toState: string; scenarioKey?: string; trigger?: string }
  ) {
    return this.scenariosService.transitionScenarioState(
      projectId,
      body.scenarioKey || "default",
      body.scenarioName,
      body.toState,
      body.trigger
    );
  }
}
