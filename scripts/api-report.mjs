// Public API report: the published type declarations, committed under api/. `npm run check` fails
// when the build's declarations differ from the committed ones, so a pull request that changes the
// public API has to say so by updating the report: `npm run build && npm run api-report -- --update`.
// Under semantic versioning, removing or changing anything in the report needs a major version.
import fs from "node:fs";

const FILES = {
  "index.d.ts": "dist/index.d.ts",
  "react.d.ts": "dist/react/index.d.ts",
  "element.d.ts": "dist/element/index.d.ts",
};
const update = process.argv.includes("--update");
const changed = [];
fs.mkdirSync("api", { recursive: true });
for (const [report, built] of Object.entries(FILES)) {
  const now = fs.readFileSync(built, "utf8");
  const path = `api/${report}`;
  const before = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : null;
  if (before === now) continue;
  if (update) fs.writeFileSync(path, now);
  else changed.push(path);
}
if (changed.length > 0) {
  console.error(
    `The public API changed: ${changed.join(", ")} differ from the build.\n` +
      "If that is intended, run: npm run build && npm run api-report -- --update\n" +
      "and commit the result. Removing or changing anything needs a major version.",
  );
  process.exit(1);
}
console.log(update ? "API report updated" : "API report matches the build");
