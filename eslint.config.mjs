import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Installed Claude skills (their own scripts, not app code):
    ".claude/**",
    "scripts/**",
    // A separate application that happens to live inside this folder. Linting
    // it here reports 22 errors that belong to a different codebase and drown
    // out Gratia's own. Also excluded in tsconfig.json and .gitignore.
    "ws-eng-event-ticketing-assessment/**",
  ]),
]);

export default eslintConfig;
