import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import postcss from "postcss";
import * as babelParser from "@babel/parser";
import generate from "@babel/generator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".idea", ".vscode"]);

/**
 * Recursively walk directory and collect files
 */
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function isCodeExt(p) {
  return /\.(jsx?|tsx?)$/i.test(p);
}
function isCssExt(p) {
  return /\.(css)$/i.test(p);
}
function isHtmlExt(p) {
  return /\.(html?)$/i.test(p);
}

function parseJs(code, filename) {
  const isTS = /\.(ts|tsx)$/i.test(filename);
  const plugins = [
    "jsx",
    "classProperties",
    "classPrivateProperties",
    "classPrivateMethods",
    "dynamicImport",
    "optionalChaining",
    "nullishCoalescingOperator",
    "objectRestSpread",
    "topLevelAwait",
  ];
  if (isTS) plugins.push("typescript");
  return babelParser.parse(code, {
    sourceType: "module",
    allowReturnOutsideFunction: true,
    plugins,
  });
}

async function stripJsComments(file) {
  const src = await fs.readFile(file, "utf8");
  try {
    const ast = parseJs(src, file);
    const { code } = generate.default(ast, { comments: false, retainLines: true }, src);
    return code;
  } catch (e) {
    console.warn(`[WARN] Skipping (parse failed): ${file}`);
    return src;
  }
}

async function stripCssComments(file) {
  const src = await fs.readFile(file, "utf8");
  try {
    const root = postcss.parse(src, { from: file });
    root.walkComments((c) => c.remove());
    return root.toString();
  } catch (e) {
    console.warn(`[WARN] Skipping CSS (parse failed): ${file}`);
    return src;
  }
}

function stripHtmlCommentsSync(src) {
  return src.replace(/<!--([\s\S]*?)-->/g, "").replace(/\n{3,}/g, "\n\n");
}

async function processFile(file) {
  if (isCodeExt(file)) {
    const out = await stripJsComments(file);
    return fs.writeFile(file, out, "utf8");
  }
  if (isCssExt(file)) {
    const out = await stripCssComments(file);
    return fs.writeFile(file, out, "utf8");
  }
  if (isHtmlExt(file)) {
    const src = await fs.readFile(file, "utf8");
    const out = stripHtmlCommentsSync(src);
    return fs.writeFile(file, out, "utf8");
  }
}

async function main() {
  const files = await walk(projectRoot);
  const targets = files.filter(
    (f) =>
      (isCodeExt(f) || isCssExt(f) || isHtmlExt(f)) &&
      !f.includes(path.sep + "node_modules" + path.sep),
  );
  console.log(`Processing ${targets.length} files...`);
  for (const f of targets) {
    await processFile(f);
  }
  console.log("Done stripping comments.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
