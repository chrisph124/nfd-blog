const tracer = require('dd-trace').init({
  service: 'nfd-blog',
  env: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  logInjection: true,
  sampleRate: Number(process.env.DD_TRACE_SAMPLE_RATE ?? 1.0),
  runtimeMetrics: true,
  profiling: process.env.DD_PROFILING_ENABLED === 'true',
  tags: { team: 'engineering', project: 'nfd-blog', language: 'nodejs' },
});

module.exports = tracer;
