import { Logger } from '@nestjs/common';

const logger = new Logger('Telemetry');

export async function setupTelemetry(): Promise<void> {
  if (process.env.OTEL_ENABLED !== 'true') {
    return;
  }

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-http'
    );
    const { PrismaInstrumentation } = await import('@prisma/instrumentation');

    const exporter = new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318/v1/traces',
    });

    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
        new PrismaInstrumentation(),
      ],
      serviceName:
        process.env.OTEL_SERVICE_NAME ?? 'client-intake-proposal-api',
    });

    await sdk.start();
    logger.log('OpenTelemetry tracing enabled');
  } catch (error) {
    logger.warn(
      `OpenTelemetry setup skipped: ${error instanceof Error ? error.message : 'unknown'}`,
    );
  }
}
