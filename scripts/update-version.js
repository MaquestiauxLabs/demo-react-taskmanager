import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const filesToUpdate = [
  { path: path.join(rootDir, "package.json"), jsonPath: "version" },
  { path: path.join(rootDir, "client", "package.json"), jsonPath: "version" },
  { path: path.join(rootDir, "server", "package.json"), jsonPath: "version" },
  { path: path.join(rootDir, "server", "configs", "swagger.ts"), tsPattern: 'version: "' },
];

function updateVersion(newVersion) {
  if (!newVersion) {
    console.error("Error: Please provide a version number");
    console.error("Usage: node scripts/update-version.js <version>");
    process.exit(1);
  }

  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  if (!semverRegex.test(newVersion)) {
    console.error(
      "Error: Invalid version format. Use semver (e.g., 1.0.0 or 1.0.0-beta)",
    );
    process.exit(1);
  }

  for (const file of filesToUpdate) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");

      if (file.tsPattern) {
        const regex = new RegExp(`(${file.tsPattern})[^"]*(")`);
        const oldVersionMatch = content.match(file.tsPattern + '([^"]+)"');
        const oldVersion = oldVersionMatch ? oldVersionMatch[1] : "unknown";
        const newContent = content.replace(regex, `$1${newVersion}$2`);
        fs.writeFileSync(file.path, newContent);
        console.log(
          `Updated ${path.relative(rootDir, file.path)}: ${oldVersion} -> ${newVersion}`,
        );
      } else {
        const json = JSON.parse(content);

        const keys = file.jsonPath.split(".");
        let current = json;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        const lastKey = keys[keys.length - 1];
        const oldVersion = current[lastKey];
        current[lastKey] = newVersion;

        fs.writeFileSync(file.path, JSON.stringify(json, null, 2) + "\n");
        console.log(
          `Updated ${path.relative(rootDir, file.path)}: ${oldVersion} -> ${newVersion}`,
        );
      }
    } catch (err) {
      console.error(`Error updating ${file.path}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\nVersion updated to ${newVersion} in all files`);
}

const newVersion = process.argv[2];
updateVersion(newVersion);
