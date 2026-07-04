import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface ServerConfig {
  host: string;
  port: number;
  username: string;
  version?: string;
}

export function parseConfig(): ServerConfig {
  const args = yargs(hideBin(process.argv))
    .option('host', {
      type: 'string',
      description: 'Minecraft server host',
      default: 'localhost'
    })
    .option('port', {
      type: 'number',
      description: 'Minecraft server port',
      default: 25565
    })
    .option('username', {
      type: 'string',
      description: 'Bot username',
      default: 'LLMBot'
    })
    .option('version', {
      type: 'string',
      description: 'Minecraft version',
      default: '1.21.1'
    })
    .help()
    .alias('help', 'h')
    .exitProcess(false)
    .parseSync();

  return {
    host: process.env.MINECRAFT_HOST || args.host as string,
    port: process.env.MINECRAFT_PORT ? parseInt(process.env.MINECRAFT_PORT, 10) : (args.port as number),
    username: process.env.MINECRAFT_USERNAME || args.username as string,
    version: process.env.MINECRAFT_VERSION || args.version as string,
  };
}
