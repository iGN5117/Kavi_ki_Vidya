const { spawnSync } = require("child_process");
const path = require("path");
const { buildToolEnv, cleanupSession, startSession } = require("./android-test-session");

const root = path.resolve(__dirname, "..");
const requestedScript = process.argv[2] || "verify-android-ui.js";
const verifierPath = path.join(__dirname, requestedScript);

async function main() {
  let status = 1;

  await startSession();
  try {
    const result = spawnSync(process.execPath, [verifierPath, ...process.argv.slice(3)], {
      cwd: root,
      env: buildToolEnv(),
      stdio: "inherit",
    });
    status = typeof result.status === "number" ? result.status : 1;
  } finally {
    await cleanupSession({ all: true });
  }

  process.exit(status);
}

main().catch(async (error) => {
  console.error(`Managed Android verification failed: ${error instanceof Error ? error.message : String(error)}`);
  await cleanupSession({ all: true }).catch(() => undefined);
  process.exit(1);
});
