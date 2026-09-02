import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import {
  createMcpHandler,
  type CreateMcpHandlerOptions,
  type McpHttpHandler,
  type McpServerFactory,
} from '@modelcontextprotocol/server';
import {
  toNodeHandler,
  type NodeMcpRequestHandler,
} from '@modelcontextprotocol/node';

export type NestMcpHttpHandler = NodeMcpRequestHandler;

/**
 * Nest lifecycle wrapper around the official stateless Streamable HTTP MCP handler.
 * Capability-specific tools belong in the consuming app, not in this package.
 */
@Injectable()
export class NestMcpHttpService implements OnApplicationShutdown {
  private readonly handlers = new Set<McpHttpHandler>();

  createHandler(
    factory: McpServerFactory,
    options: CreateMcpHandlerOptions = {},
  ): NestMcpHttpHandler {
    const handler = createMcpHandler(factory, options);
    this.handlers.add(handler);
    return toNodeHandler(handler);
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.handlers].map((handler) => handler.close()));
    this.handlers.clear();
  }
}
