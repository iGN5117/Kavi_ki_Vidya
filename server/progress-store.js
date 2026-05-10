const fs = require("node:fs");
const path = require("node:path");

const defaultSupabaseTableName = "learner_progress";

function createFileProgressRepository({ storageDir, sanitizeProgressPayload, clampText, clampNumber }) {
  fs.mkdirSync(storageDir, { recursive: true });

  function getProgressFilePath(profileId) {
    return path.join(storageDir, `${profileId}.json`);
  }

  function sanitizeActor(actor) {
    if (!actor) return null;

    return {
      userId: clampText(actor.userId, "legacy-local", 160),
      provider: clampText(actor.provider, "legacy", 32),
      profileId: clampText(actor.profileId, "", 80),
      source: clampText(actor.source, "legacy-local", 80),
    };
  }

  async function read(profileId) {
    try {
      const stored = JSON.parse(fs.readFileSync(getProgressFilePath(profileId), "utf8"));
      if (!stored || typeof stored !== "object") return undefined;

      return {
        profileId,
        progress: sanitizeProgressPayload(stored.progress),
        updatedAt: clampText(stored.updatedAt, new Date(0).toISOString(), 40),
        revision: clampNumber(stored.revision, 0, 0, Number.MAX_SAFE_INTEGER),
        ownerUserId: clampText(stored.ownerUserId, "", 160) || null,
        authProvider: clampText(stored.authProvider, "", 32) || null,
        lastWriteSource: clampText(stored.lastWriteSource, "legacy-local", 80),
      };
    } catch {
      return undefined;
    }
  }

  async function write(profileId, progress, actor) {
    const existing = await read(profileId);
    const sanitizedActor = sanitizeActor(actor);
    const record = {
      profileId,
      progress,
      updatedAt: new Date().toISOString(),
      revision: (existing?.revision || 0) + 1,
      ownerUserId: sanitizedActor?.userId ?? existing?.ownerUserId ?? null,
      authProvider: sanitizedActor?.provider ?? existing?.authProvider ?? null,
      lastWriteSource: sanitizedActor?.source ?? "legacy-local",
    };

    fs.writeFileSync(getProgressFilePath(profileId), JSON.stringify(record, null, 2));
    return record;
  }

  function info() {
    return {
      provider: "file-json",
      location: storageDir,
      productionReady: false,
      supportsAuthScopedRecords: true,
    };
  }

  return {
    info,
    read,
    write,
  };
}

function createSupabaseProgressRepository({
  supabaseUrl,
  serviceRoleKey,
  tableName = defaultSupabaseTableName,
  sanitizeProgressPayload,
  clampText,
  clampNumber,
}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase progress storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const restBaseUrl = `${String(supabaseUrl).replace(/\/+$/, "")}/rest/v1/${encodeURIComponent(tableName)}`;

  function getHeaders(extra = {}) {
    return {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      ...extra,
    };
  }

  function sanitizeActor(actor) {
    if (!actor) return null;

    return {
      userId: clampText(actor.userId, "legacy-local", 160),
      provider: clampText(actor.provider, "legacy", 32),
      source: clampText(actor.source, "legacy-local", 80),
    };
  }

  function rowToRecord(row, profileId) {
    if (!row || typeof row !== "object") return undefined;

    return {
      profileId,
      progress: sanitizeProgressPayload(row.progress),
      updatedAt: clampText(row.updated_at, new Date(0).toISOString(), 40),
      revision: clampNumber(row.revision, 0, 0, Number.MAX_SAFE_INTEGER),
      ownerUserId: clampText(row.owner_user_id, "", 160) || null,
      authProvider: clampText(row.auth_provider, "", 32) || null,
      lastWriteSource: clampText(row.last_write_source, "supabase-rest", 80),
    };
  }

  async function parseSupabaseResponse(response, fallbackMessage) {
    const text = await response.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : undefined;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object"
          ? [payload.message, payload.details, payload.hint].filter(Boolean).join(" ")
          : String(payload || "");
      throw new Error(detail ? `${fallbackMessage}: ${detail}` : fallbackMessage);
    }

    return payload;
  }

  async function read(profileId) {
    const url = `${restBaseUrl}?profile_id=eq.${encodeURIComponent(profileId)}&select=profile_id,progress,updated_at,revision,owner_user_id,auth_provider,last_write_source&limit=1`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    const payload = await parseSupabaseResponse(response, "Supabase progress read failed");
    const row = Array.isArray(payload) ? payload[0] : undefined;

    return rowToRecord(row, profileId);
  }

  async function write(profileId, progress, actor) {
    const existing = await read(profileId);
    const sanitizedActor = sanitizeActor(actor);
    const record = {
      profileId,
      progress,
      updatedAt: new Date().toISOString(),
      revision: (existing?.revision || 0) + 1,
      ownerUserId: sanitizedActor?.userId ?? existing?.ownerUserId ?? null,
      authProvider: sanitizedActor?.provider ?? existing?.authProvider ?? null,
      lastWriteSource: sanitizedActor?.source ?? "supabase-rest",
    };
    const row = {
      profile_id: record.profileId,
      progress: record.progress,
      updated_at: record.updatedAt,
      revision: record.revision,
      owner_user_id: record.ownerUserId,
      auth_provider: record.authProvider,
      last_write_source: record.lastWriteSource,
    };
    const response = await fetch(`${restBaseUrl}?on_conflict=profile_id`, {
      method: "POST",
      headers: getHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(row),
    });
    const payload = await parseSupabaseResponse(response, "Supabase progress write failed");
    const savedRow = Array.isArray(payload) ? payload[0] : payload;

    return rowToRecord(savedRow, profileId) ?? record;
  }

  function info() {
    return {
      provider: "supabase-rest",
      tableName,
      productionReady: true,
      supportsAuthScopedRecords: true,
    };
  }

  return {
    info,
    read,
    write,
  };
}

function createProgressRepository({
  env = process.env,
  storageDir,
  sanitizeProgressPayload,
  clampText,
  clampNumber,
}) {
  const provider = (env.PROGRESS_STORAGE_PROVIDER || "file-json").trim().toLowerCase();

  if (provider === "supabase" || provider === "supabase-rest") {
    return createSupabaseProgressRepository({
      supabaseUrl: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      tableName: env.SUPABASE_PROGRESS_TABLE || defaultSupabaseTableName,
      sanitizeProgressPayload,
      clampText,
      clampNumber,
    });
  }

  if (provider !== "file-json") {
    throw new Error(`Unsupported PROGRESS_STORAGE_PROVIDER "${provider}". Use file-json or supabase-rest.`);
  }

  return createFileProgressRepository({
    storageDir,
    sanitizeProgressPayload,
    clampText,
    clampNumber,
  });
}

module.exports = {
  createFileProgressRepository,
  createProgressRepository,
  createSupabaseProgressRepository,
};
