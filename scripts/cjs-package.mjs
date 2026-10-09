// Turns the CommonJS build in dist-cjs/ into a publishable package: the same package name at version
// "<version>-cjs", published under the npm dist-tag "cjs" next to the ES module release, for tooling
// that cannot load ES modules (Jest, older bundlers). Released by .github/workflows/release.yml.
import fs from "node:fs";

const main = JSON.parse(fs.readFileSync("package.json", "utf8"));
const out = "dist-cjs";
const pkg = {
  name: main.name,
  version: `${main.version}-cjs`,
  description: `CommonJS build of ${main.name}, for Jest and other tooling that cannot load ES modules.`,
  license: main.license,
  sideEffects: false,
  main: "./index.cjs",
  types: "./index.d.cts",
  exports: {
    ".": { types: "./index.d.cts", default: "./index.cjs" },
    "./react": { types: "./react/index.d.cts", default: "./react/index.cjs" },
    "./package.json": "./package.json",
  },
  typesVersions: { "*": { react: ["./react/index.d.cts"] } },
  engines: { node: ">=18" },
  peerDependencies: main.peerDependencies,
  peerDependenciesMeta: main.peerDependenciesMeta,
  keywords: main.keywords,
  repository: main.repository,
  homepage: main.homepage,
  bugs: main.bugs,
  publishConfig: main.publishConfig,
};
fs.writeFileSync(`${out}/package.json`, JSON.stringify(pkg, null, 2) + "\n");
fs.writeFileSync(
  `${out}/README.md`,
  `# ${main.name} (CommonJS build)

This is the CommonJS build of [${main.name}](https://www.npmjs.com/package/${main.name})
${main.version}, for tooling that cannot load ES modules, such as Jest. Everywhere else (Node.js
22.12+, Vite, webpack, Next.js, ...) use the default release instead.

\`\`\`bash
npm install ${main.name}@cjs --save-exact
\`\`\`

\`--save-exact\` matters: to npm, "${pkg.version}" is a pre-release of ${main.version}, so a
range such as "^${pkg.version}" would later install the ES module release.

Documentation: https://github.com/Lansenou/Mil-Symbol-Converter
`,
);
for (const f of ["LICENSE", "NOTICE"]) fs.copyFileSync(f, `${out}/${f}`);
console.log(`${out}/: ${pkg.name}@${pkg.version}`);
