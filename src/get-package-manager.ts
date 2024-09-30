import { detect } from "detect-package-manager";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export async function getPackageManager(): Promise<PackageManager> {
  const packageManager = await detect();
  return packageManager;
}

// export function getPackageManager(): PackageManager {
//   const userAgent = process.env.npm_config_user_agent || "";
//   console.log({ userAgent });
//   if (userAgent.startsWith("yarn")) {
//     return "yarn";
//   }

//   if (userAgent.startsWith("pnpm")) {
//     return "pnpm";
//   }

//   if (userAgent.startsWith("bun")) {
//     return "bun";
//   }

//   return "npm";
// }
