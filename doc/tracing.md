# Tracing (OpenTelemetry) Setup Notes

## Collector
- Deploy OpenTelemetry Collector as a sidecar or service in `infra/docker/` (optional for dev)
- Exporters: `otlp` to Grafana Tempo/Jaeger (your choice)

## API (NestJS)
- Use `@opentelemetry/api`, `@opentelemetry/sdk-node`, and NestJS instrumentation
- Instrument HTTP server, axios outbound calls, pg client
- Propagate context via W3C trace headers

## Worker (BullMQ)
- Wrap job handlers with spans (start/end)
- Record job id, queue name, duration, outcome (ok/fail)

## Dashboards
- In Grafana, add Tempo/Jaeger datasource
- Create service map and request latency panels

## Next Steps
- Once infra is chosen (Tempo vs Jaeger), I will add the collector config and minimal bootstrap code in API/worker.
