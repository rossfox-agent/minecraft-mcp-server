import { z } from "zod";
import mineflayer from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';
import { BotConnection } from '../bot-connection.js';

export function registerConnectionTools(factory: ToolFactory, connection: BotConnection, getBot: () => mineflayer.Bot | null): void {
  factory.registerConnectionTool(
    "connect-server",
    "Connect the bot to the configured Minecraft server",
    {},
    async () => {
      const state = connection.getState();
      if (state === 'connected') {
        return factory.createResponse("Bot is already connected");
      }
      if (state === 'connecting') {
        return factory.createResponse("Bot is already connecting");
      }
      connection.connect();
      return factory.createResponse("Connecting to Minecraft server...");
    }
  );

  factory.registerConnectionTool(
    "disconnect-server",
    "Disconnect the bot from the Minecraft server",
    {},
    async () => {
      const state = connection.getState();
      if (state === 'disconnected') {
        return factory.createResponse("Bot is already disconnected");
      }
      connection.disconnect();
      return factory.createResponse("Disconnected from Minecraft server");
    }
  );

  factory.registerConnectionTool(
    "connection-status",
    "Get the current connection status of the bot",
    {},
    async () => {
      const state = connection.getState();
      const config = connection.getConfig();
      const bot = getBot();
      let output = `Connection state: ${state}\n`;
      output += `Target server: ${config.host}:${config.port}\n`;
      output += `Username: ${config.username}\n`;
      if (bot && state === 'connected') {
        output += `Bot is online and spawned`;
      } else {
        output += `Bot is offline`;
      }
      return factory.createResponse(output);
    }
  );

  factory.registerConnectionTool(
    "reconfigure-server",
    "Change the Minecraft server configuration (host, port, username). Disconnects any active connection.",
    {
      host: z.string().optional().describe("Minecraft server host (default: current)"),
      port: z.number().optional().describe("Minecraft server port (default: current)"),
      username: z.string().optional().describe("Bot username (default: current)")
    },
    async ({ host, port, username }) => {
      const oldConfig = connection.getConfig();
      const newConfig = {
        host: host ?? oldConfig.host,
        port: port ?? oldConfig.port,
        username: username ?? oldConfig.username
      };

      if (connection.getState() !== 'disconnected') {
        connection.disconnect();
      }

      connection.setConfig(newConfig);
      return factory.createResponse(
        `Server configuration updated. Next connection will use ${newConfig.host}:${newConfig.port} as ${newConfig.username}`
      );
    }
  );
}
