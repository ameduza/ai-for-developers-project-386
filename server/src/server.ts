import { createApp } from './app.js';
import { defaultSeed } from './default-seed.js';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';
type AppOptions = Parameters<typeof createApp>[0];
type DeploymentOptions = Pick<
  AppOptions,
  'clientOrigin' | 'apiBasePath' | 'clientDirectory'
>;

const deploymentOptions = (
  isProduction
    ? {
        clientOrigin: null,
        apiBasePath: '/api',
        clientDirectory: fileURLToPath(
          new URL('../../client/dist', import.meta.url),
        ),
      }
    : {
        clientOrigin: process.env.CLIENT_ORIGIN,
        apiBasePath: '/',
        clientDirectory: undefined,
      }
) satisfies DeploymentOptions;

const app = createApp({
  now: () => new Date(),
  seed: defaultSeed,
  ...deploymentOptions,
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
