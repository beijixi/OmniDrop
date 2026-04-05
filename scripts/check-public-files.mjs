import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const targets = [
  path.join(root, "README.md"),
  path.join(root, ".env.example"),
  path.join(root, "src/components/settings-form.tsx")
];

for (const entry of readdirSync(docsDir)) {
  if (entry.endsWith(".md")) {
    targets.push(path.join(docsDir, entry));
  }
}

const issues = [];

const forbiddenPatterns = [
  {
    label: "legacy deployment document name",
    pattern: /deployment-fnos/i
  },
  {
    label: "environment-specific platform wording",
    pattern: /\bNAS\b|飞牛/i
  },
  {
    label: "private IPv4 literal",
    pattern:
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/
  },
  {
    label: "host-specific absolute volume path",
    pattern: /\/vol\d+\//
  }
];

const urlPattern = /https?:\/\/[^\s)"'`]+/g;
const allowedHosts = new Set(["localhost", "127.0.0.1", "example.com"]);

for (const file of targets) {
  if (!statSync(file).isFile()) {
    continue;
  }

  const content = readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(line)) {
        issues.push(`${relative}:${index + 1} contains ${rule.label}`);
      }
    }

    const matches = line.match(urlPattern) ?? [];
    for (const match of matches) {
      let host = "";

      try {
        host = new URL(match).hostname;
      } catch {
        continue;
      }

      if (host.includes("<") || host.includes(">")) {
        continue;
      }

      if (allowedHosts.has(host) || host.endsWith(".example.com")) {
        continue;
      }

      issues.push(`${relative}:${index + 1} contains non-placeholder host ${host}`);
    }
  });
}

if (issues.length > 0) {
  console.error("Public file guard failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Public file guard passed.");
