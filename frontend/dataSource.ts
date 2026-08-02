export type DataSource = "local" | "api";

export function resolveDataSource(value: string | undefined): DataSource {
  if (value === undefined || value === "local") return "local";
  if (value === "api") return "api";

  throw new Error(
    `NEXT_PUBLIC_DATA_SOURCE must be "local" or "api" (received: ${JSON.stringify(value)})`,
  );
}

export const DATA_SOURCE = resolveDataSource(process.env.NEXT_PUBLIC_DATA_SOURCE);
