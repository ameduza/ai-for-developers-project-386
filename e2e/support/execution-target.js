/** @typedef {'development' | 'production'} ExecutionTarget */
/**
 * @typedef {{
 *   kind: 'development-services',
 * } | {
 *   kind: 'docker-image',
 *   containerName: string,
 *   imageTag: string,
 *   port: string,
 *   readinessPath: string,
 * }} ServiceTopology
 */
/**
 * @typedef {{
 *   browserOrigin: string,
 *   apiOrigin: string,
 *   webServer: import('@playwright/test').PlaywrightTestConfig['webServer'],
 *   topology: ServiceTopology,
 * }} TargetSettings
 */

const developmentBrowserPort = '4173';
const developmentApiPort = '3100';
const productionPort = '4317';
const developmentBrowserOrigin = `http://localhost:${developmentBrowserPort}`;
const developmentApiOrigin = `http://localhost:${developmentApiPort}`;
const productionBrowserOrigin = `http://localhost:${productionPort}`;

/** @type {Record<ExecutionTarget, (isCi: boolean) => TargetSettings>} */
const settingsByTarget = {
  development: (isCi) => ({
    browserOrigin: developmentBrowserOrigin,
    apiOrigin: developmentApiOrigin,
    webServer: [
      {
        command: 'npm --prefix .. run start --workspace server',
        url: `${developmentApiOrigin}/owner`,
        env: /** @type {Record<string, string>} */ ({
          CLIENT_ORIGIN: developmentBrowserOrigin,
          PORT: developmentApiPort,
        }),
        reuseExistingServer: !isCi,
      },
      {
        command: `npm --prefix .. run dev:web --workspace client -- --host localhost --port ${developmentBrowserPort}`,
        url: developmentBrowserOrigin,
        env: /** @type {Record<string, string>} */ ({
          VITE_API_BASE_URL: developmentApiOrigin,
        }),
        reuseExistingServer: !isCi,
      },
    ],
    topology: {
      kind: 'development-services',
    },
  }),
  production: () => ({
    browserOrigin: productionBrowserOrigin,
    apiOrigin: `${productionBrowserOrigin}/api`,
    webServer: undefined,
    topology: {
      kind: 'docker-image',
      containerName: 'booking-service-e2e',
      imageTag: 'booking-service-e2e:local',
      port: productionPort,
      readinessPath: '/owner',
    },
  }),
};

/**
 * @param {string | undefined} value
 * @returns {ExecutionTarget}
 */
export function resolveExecutionTarget(value) {
  if (value === undefined) {
    return 'development';
  }

  if (Object.hasOwn(settingsByTarget, value)) {
    return /** @type {ExecutionTarget} */ (value);
  }

  throw new Error(
    `E2E_TARGET must be "development" or "production"; received ${JSON.stringify(value)}`,
  );
}

/**
 * @param {string | undefined} value
 * @param {boolean} isCi
 * @returns {TargetSettings}
 */
export function resolveTargetSettings(value, isCi) {
  const target = resolveExecutionTarget(value);
  return settingsByTarget[target](isCi);
}
