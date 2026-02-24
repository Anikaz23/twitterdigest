export type SettingValue = string | null | undefined;
export type SettingsSnapshot = Record<string, SettingValue>;

export function dbThenEnv(dbValue: SettingValue, envValue?: string): string | null {
  if (dbValue !== null && dbValue !== undefined) return dbValue;
  return envValue ?? null;
}

export function pickSetting(snapshot: SettingsSnapshot, key: string, envValue?: string): string | null {
  return dbThenEnv(snapshot[key], envValue);
}

export function nonEmptyOrDefault(value: SettingValue, fallback: string): string {
  if (value === null || value === undefined || value.trim() === "") return fallback;
  return value;
}

export function numberOrDefault(value: SettingValue, fallback: number): number {
  if (value === null || value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isNonEmpty(value: SettingValue): boolean {
  return Boolean(value && value.trim() !== "");
}
