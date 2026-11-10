import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { ProjectStatus, MockAuth, Protocol } from "@prisma/client";

@Injectable()
export class ProjectsService {
  constructor(private readonly dataStore: DataStoreService) {}

  async createProject(
    workspaceId: string,
    data: {
      name: string;
      slug: string;
      environment?: string;
      mockAuth?: MockAuth;
      protocol?: Protocol;
    }
  ) {
    const existing = await this.dataStore.findProjectBySlug(workspaceId, data.slug);
    if (existing) {
      throw new ConflictException(`Project with slug '${data.slug}' already exists in this workspace`);
    }

    return this.dataStore.createProject({
      workspaceId,
      name: data.name,
      slug: data.slug,
      environment: data.environment || "dev",
      mockAuth: data.mockAuth || MockAuth.PRIVATE, // Private by default per §15.3
      protocol: data.protocol || Protocol.REST,
    });
  }

  async listWorkspaceProjects(workspaceId: string) {
    return this.dataStore.listWorkspaceProjects(workspaceId);
  }

  async getProject(projectId: string) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const latestSpec = await this.dataStore.getLatestSpecVersion(projectId);
    const rules = await this.dataStore.listMockRules(projectId);

    return {
      ...project,
      mockUrl: `https://${project.slug}.mocklab.dev`,
      localMockUrl: `http://localhost:3001/m/${project.slug}`,
      specVersion: latestSpec?.version || null,
      rulesCount: rules.length,
    };
  }

  async setProjectStatus(projectId: string, status: ProjectStatus) {
    const updated = await this.dataStore.updateProjectStatus(projectId, status);
    if (!updated) throw new NotFoundException("Project not found");
    return updated;
  }
}
