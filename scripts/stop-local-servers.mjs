import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ports = process.argv.slice(2).filter((arg) => /^\d+$/.test(arg));
const targetPorts = ports.length ? ports : ["4000", "4173", "5173"];
const dryRun = process.argv.includes("--dry-run");

const runPowerShell = async (command) => {
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
  return stdout.trim();
};

const findPids = async () => {
  const portList = targetPorts.join(",");
  const command = [
    `$ports = @(${portList});`,
    "$connections = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' -or $_.State -eq 'Established' -or $_.State -eq 'CloseWait' -or $_.State -eq 'FinWait2' };",
    "$connections | Select-Object LocalPort,OwningProcess,State | ConvertTo-Json -Compress"
  ].join(" ");

  const output = await runPowerShell(command);
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const stopPids = async (pids) => {
  if (!pids.length) return;
  const pidList = pids.join(",");
  await runPowerShell(`$pids = @(${pidList}); foreach ($pidValue in $pids) { if ($pidValue -and $pidValue -ne $PID) { Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue } }`);
};

const connections = await findPids();
const pids = [...new Set(connections.map((connection) => connection.OwningProcess).filter((pid) => pid && pid !== 0))];

if (!pids.length) {
  console.log(`No local app servers found on ports ${targetPorts.join(", ")}.`);
  process.exit(0);
}

console.table(connections);

if (dryRun) {
  console.log(`Dry run only. Would stop PIDs: ${pids.join(", ")}`);
  process.exit(0);
}

await stopPids(pids);
console.log(`Stopped local app server PIDs: ${pids.join(", ")}`);
