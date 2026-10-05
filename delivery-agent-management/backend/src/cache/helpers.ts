import { safeGet, safeSet, safeDel, safeIncr, safeGet_number } from "./redis";

const AGENT_TTL = 5 * 60; // 5 minutes
const LIST_TTL = 60; // 60 seconds
const VERSION_KEY = "agents:list:version";

export function agentKey(id: string): string {
  return `agent:${id}`;
}

export async function getListVersion(): Promise<number> {
  return safeGet_number(VERSION_KEY);
}

export async function bumpListVersion(): Promise<void> {
  await safeIncr(VERSION_KEY);
}

export function listKey(version: number, normalizedQuery: string): string {
  return `agents:list:v${version}:${normalizedQuery}`;
}

export async function getCachedAgent(id: string): Promise<{ data: object; hit: boolean }> {
  const raw = await safeGet(agentKey(id));
  if (raw) return { data: JSON.parse(raw), hit: true };
  return { data: {}, hit: false };
}

export async function setCachedAgent(id: string, agent: object): Promise<void> {
  await safeSet(agentKey(id), JSON.stringify(agent), AGENT_TTL);
}

export async function getCachedList(
  query: Record<string, unknown>
): Promise<{ data: object; hit: boolean; key: string }> {
  const version = await getListVersion();
  const normalized = JSON.stringify(
    Object.fromEntries(Object.entries(query).sort(([a], [b]) => a.localeCompare(b)))
  );
  const key = listKey(version, normalized);
  const raw = await safeGet(key);
  if (raw) return { data: JSON.parse(raw), hit: true, key };
  return { data: {}, hit: false, key };
}

export async function setCachedList(key: string, data: object): Promise<void> {
  await safeSet(key, JSON.stringify(data), LIST_TTL);
}

export async function invalidateAgent(id: string): Promise<void> {
  await safeDel(agentKey(id));
  await bumpListVersion();
}

export async function invalidateListOnly(): Promise<void> {
  await bumpListVersion();
}
