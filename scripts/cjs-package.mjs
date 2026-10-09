// Turns the CommonJS build in dist-cjs/ into the package mil-symbol-converter-cjs: the same code
// as mil-symbol-converter for tooling that cannot load ES modules (Jest, older bundlers).
// Released together with the main package by .github/workflows/release.yml.
import fs from "node:fs";

const main = JSON.parse(fs.readFileSync("package.json", "utf8"));
const out = "dist-cjs";
const pkg = {
  name: `${main.name}-cjs`,
  version: main.version,
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
  `# ${pkg.name}

The CommonJS build of [${main.name}](https://www.npmjs.com/package/${main.name}), released with
it at the same version. Use it only where ES modules cannot be loaded, such as Jest; everywhere
else (Node.js 22.12+, Vite, webpack, Next.js, ...) install \`${main.name}\` instead.

Installing it under the main name keeps your imports unchanged:

\`\`\`bash
npm install ${main.name}@npm:${pkg.name}
\`\`\`

Documentation: https://github.com/Lansenou/Mil-Symbol-Converter
`,
);
for (const f of ["LICENSE", "NOTICE"]) fs.copyFileSync(f, `${out}/${f}`);
console.log(`${out}/: ${pkg.name}@${pkg.version}`);
