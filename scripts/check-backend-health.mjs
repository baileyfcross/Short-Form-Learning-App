const url = process.env.BACKEND_HEALTH_URL ?? `http://localhost:${process.env.PORT ?? "4000"}/api/health`;

try {
  const response = await fetch(url);
  const body = await response.text();

  console.log(`GET ${url}`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
} catch (error) {
  console.error(`GET ${url}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
