const { openSync } = require("node:fs");
const { join } = require("node:path");
const { spawn } = require("node:child_process");

const root = join(__dirname, "..");
const out = openSync(join(root, "frontend-dev.log"), "a");
const err = openSync(join(root, "frontend-dev.err.log"), "a");

const child = spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev --workspace frontend"], {
  cwd: root,
  detached: true,
  stdio: ["ignore", out, err],
  windowsHide: true
});

child.unref();
console.log(child.pid);
