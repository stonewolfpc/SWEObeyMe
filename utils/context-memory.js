import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Context Memory Utility
 * 
 * Manages persistent context across AI sessions using the external memory MCP server.
 * This prevents the "I forgot the project structure" problem by maintaining:
 * - Project architecture decisions
 * - File relationships and dependencies  
 * - Session state and current tasks
 */

const MEMORY_ENTITY_SCHEMA = z.object({
  name: z.string(),
  entityType: z.string(),
  observations: z.array(z.string())
});

const MEMORY_RELATION_SCHEMA = z.object({
  from: z.string(),
  to: z.string(),
  relationType: z.string()
});

class ContextMemory {
  constructor() {
    this.client = null;
    this.connected = false;
    this.localCache = new Map(); // Fallback if MCP memory unavailable
  }

  /**
   * Initialize connection to memory MCP server
   */
  async init() {
    try {
      this.client = new Client({ name: "SWEObeyMe-Context", version: "1.0.12" });
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"]
      });
      await this.client.connect(transport);
      this.connected = true;
      console.error("[ContextMemory] Connected to MCP memory server");
    } catch (error) {
      console.error("[ContextMemory] MCP memory unavailable, using local cache:", error.message);
      this.connected = false;
    }
  }

  /**
   * Create or update a knowledge entity
   */
  async createEntity(name, entityType, observations) {
    const entity = { name, entityType, observations };
    
    if (this.connected && this.client) {
      try {
        await this.client.request({
          method: "tools/call",
          params: {
            name: "create_entities",
            arguments: { entities: [entity] }
          }
        }, CallToolRequestSchema);
        console.error(`[ContextMemory] Entity created: ${name} (${entityType})`);
      } catch (error) {
        console.error("[ContextMemory] Failed to create entity:", error.message);
        this.localCache.set(`${entityType}:${name}`, entity);
      }
    } else {
      this.localCache.set(`${entityType}:${name}`, entity);
      console.error(`[ContextMemory] Cached entity: ${name} (${entityType})`);
    }
  }

  /**
   * Create a relation between entities
   */
  async createRelation(from, to, relationType) {
    const relation = { from, to, relationType };
    
    if (this.connected && this.client) {
      try {
        await this.client.request({
          method: "tools/call",
          params: {
            name: "create_relations",
            arguments: { relations: [relation] }
          }
        }, CallToolRequestSchema);
        console.error(`[ContextMemory] Relation created: ${from} -> ${to} (${relationType})`);
      } catch (error) {
        console.error("[ContextMemory] Failed to create relation:", error.message);
      }
    }
  }

  /**
   * Search for entities by query
   */
  async searchNodes(query) {
    if (this.connected && this.client) {
      try {
        const result = await this.client.request({
          method: "tools/call",
          params: {
            name: "search_nodes",
            arguments: { query }
          }
        }, CallToolRequestSchema);
        return result.content[0]?.text ? JSON.parse(result.content[0].text) : [];
      } catch (error) {
        console.error("[ContextMemory] Search failed:", error.message);
        return this.localSearch(query);
      }
    }
    return this.localSearch(query);
  }

  /**
   * Local cache search fallback
   */
  localSearch(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [key, entity] of this.localCache) {
      if (entity.name.toLowerCase().includes(lowerQuery) ||
          entity.entityType.toLowerCase().includes(lowerQuery) ||
          entity.observations.some(obs => obs.toLowerCase().includes(lowerQuery))) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Get context summary for injection into prompts
   */
  async getContextSummary() {
    const entities = await this.searchNodes("project");
    const recentFiles = await this.searchNodes("file");
    
    let summary = "=== PROJECT CONTEXT ===\n";
    
    if (entities.length > 0) {
      summary += "\n[Entities]:\n";
      entities.slice(0, 5).forEach(e => {
        summary += `- ${e.name} (${e.entityType}): ${e.observations[0] || 'No description'}\n`;
      });
    }
    
    if (recentFiles.length > 0) {
      summary += "\n[Recent Files]:\n";
      recentFiles.slice(0, 5).forEach(f => {
        summary += `- ${f.name}\n`;
      });
    }
    
    summary += "\n=== END CONTEXT ===\n\n";
    return summary;
  }

  /**
   * Remember current file being edited
   */
  async rememberFile(filepath, lineCount, purpose) {
    await this.createEntity(
      filepath,
      "file",
      [`Line count: ${lineCount}`, `Purpose: ${purpose}`, `Last accessed: ${new Date().toISOString()}`]
    );
  }

  /**
   * Remember architectural decision
   */
  async rememberDecision(decision, reasoning) {
    await this.createEntity(
      `decision-${Date.now()}`,
      "architectural_decision",
      [decision, reasoning, `Made: ${new Date().toISOString()}`]
    );
  }
}

export { ContextMemory };
