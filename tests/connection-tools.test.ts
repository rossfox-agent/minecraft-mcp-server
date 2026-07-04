import test from 'ava';
import sinon from 'sinon';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import { registerConnectionTools } from '../src/tools/connection-tools.js';

function createFactory(connection: BotConnection): ToolFactory {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return new ToolFactory(server, connection);
}

function getToolHandler(factory: ToolFactory, toolName: string): (args: unknown) => Promise<unknown> {
  const server = (factory as unknown as { server: McpServer }).server;
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: unknown) => Promise<unknown> }> })._registeredTools;
  const tool = tools[toolName];
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }
  return tool.handler;
}

test('registerConnectionTools registers connect-server tool', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'connect-server');
  t.truthy(handler);
});

test('registerConnectionTools registers disconnect-server tool', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'disconnect-server');
  t.truthy(handler);
});

test('registerConnectionTools registers connection-status tool', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'connection-status');
  t.truthy(handler);
});

test('registerConnectionTools registers reconfigure-server tool', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'reconfigure-server');
  t.truthy(handler);
});

test('connect-server returns already connected when state is connected', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  (connection as unknown as { state: string }).state = 'connected';

  const handler = getToolHandler(factory, 'connect-server');
  const result = await handler({});
  t.is((result as { content: Array<{ text: string }> }).content[0].text, 'Bot is already connected');
});

test('disconnect-server returns already disconnected when state is disconnected', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  (connection as unknown as { state: string }).state = 'disconnected';

  const handler = getToolHandler(factory, 'disconnect-server');
  const result = await handler({});
  t.is((result as { content: Array<{ text: string }> }).content[0].text, 'Bot is already disconnected');
});

test('connection-status reports disconnected state', async (t) => {
  const config = { host: 'example.com', port: 30000, username: 'MyBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'connection-status');
  const result = await handler({});
  const text = (result as { content: Array<{ text: string }> }).content[0].text;
  t.true(text.includes('disconnected'));
  t.true(text.includes('example.com:30000'));
  t.true(text.includes('MyBot'));
  t.true(text.includes('offline'));
});

test('connection-status reports connected state', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => ({ username: 'TestBot' }) as any);

  (connection as unknown as { state: string }).state = 'connected';

  const handler = getToolHandler(factory, 'connection-status');
  const result = await handler({});
  const text = (result as { content: Array<{ text: string }> }).content[0].text;
  t.true(text.includes('connected'));
  t.true(text.includes('online'));
});

test('reconfigure-server updates config', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  const handler = getToolHandler(factory, 'reconfigure-server');
  const result = await handler({ host: 'mc.example.com', port: 30001, username: 'NewBot' });
  const text = (result as { content: Array<{ text: string }> }).content[0].text;
  t.true(text.includes('mc.example.com:30001'));
  t.true(text.includes('NewBot'));

  const newConfig = connection.getConfig();
  t.is(newConfig.host, 'mc.example.com');
  t.is(newConfig.port, 30001);
  t.is(newConfig.username, 'NewBot');
});

test('disconnect-server calls disconnect when connected', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  (connection as unknown as { state: string }).state = 'connected';
  const disconnectSpy = sinon.stub(connection, 'disconnect');

  const handler = getToolHandler(factory, 'disconnect-server');
  const result = await handler({});
  t.true(disconnectSpy.calledOnce);
  t.is((result as { content: Array<{ text: string }> }).content[0].text, 'Disconnected from Minecraft server');

  disconnectSpy.restore();
});

test('connect-server returns connecting when state is connecting', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  const factory = createFactory(connection);

  registerConnectionTools(factory, connection, () => null);

  (connection as unknown as { state: string }).state = 'connecting';

  const handler = getToolHandler(factory, 'connect-server');
  const result = await handler({});
  t.is((result as { content: Array<{ text: string }> }).content[0].text, 'Bot is already connecting');
});
