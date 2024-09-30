#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import prompts from "prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getPackageManager } from "./get-package-manager.js";

const argv = yargs(hideBin(process.argv))
  .option("file", {
    alias: "f",
    type: "string",
    description: "Specify a custom .env file path",
    default: ".env",
  })
  .parse();

async function main() {
  try {
    let envPath: string;
    if (argv instanceof Promise) {
      envPath = (await argv).file;
    } else envPath = argv.file;

    const envContent = await fs.readFile(
      path.resolve(process.cwd(), envPath),
      "utf-8",
    );
    const envConfig = dotenv.parse(envContent);

    const zodSchema = generateZodSchema(envConfig);
    const configContent = generateConfigFile(zodSchema, envPath);

    await fs.writeFile(path.resolve(process.cwd(), "config.ts"), configContent);
    console.log("config.ts file has been created successfully.");

    //Ask if they want to instal zod
    const packageManager = await getPackageManager();

    const shouldInstallZod = await askToInstallDependencies();
    if (shouldInstallZod) {
      await installDependencies(packageManager);
    }
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

function generateZodSchema(envConfig: Record<string, string>): string {
  const schemaLines = Object.entries(envConfig).map(([key, value]) => {
    let zodType = "z.string()";
    if (value === "") {
      zodType += ".optional()";
    } else if (isUrl(value)) {
      zodType = "z.string().url()";
    }
    return `  ${key}: ${zodType},`;
  });

  return `z.object({\n${schemaLines.join("\n")}\n})`;
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function generateConfigFile(zodSchema: string, envPath: string): string {
  return `import { z } from 'zod';
import {config as dotenvConfig} from "dotenv"

${
  envPath === ".env"
    ? "dotenvConfig()"
    : "dotenvConfig({path: " + JSON.stringify(envPath) + "})"
}

const envSchema = ${zodSchema};

const config = envSchema.parse(process.env);

export default config;
`;
}

async function askToInstallDependencies(): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "installDependencies",
    message: "Do you want to install dependencies?",
    initial: true,
  });

  return response.installDependencies;
}

async function installDependencies(packageManager: string): Promise<void> {
  const packages = ["zod", "dotenv"];
  console.log(
    `Installing packages ${packages.join(", ")} using ${packageManager}...`,
  );
  const packagesString = packages.join(" ");
  try {
    let command: string;
    switch (packageManager) {
      case "npm":
        command = `npm install ${packagesString}`;
        break;
      case "pnpm":
        command = `pnpm add ${packagesString}`;
        break;
      case "yarn":
        command = `yarn add ${packagesString}`;
        break;
      case "bun":
        command = `bun add ${packagesString}`;
        break;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    execSync(command, { stdio: "inherit" });
    console.log("Packages installed successfully.");
  } catch (error) {
    console.error("Failed to install Zod:", error);
  }
}

main();
