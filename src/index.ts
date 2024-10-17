#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import * as z from "zod";
import prompts from "prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getPackageManager } from "./get-package-manager.js";

let argv = yargs(hideBin(process.argv))
  .option("file", {
    alias: "f",
    type: "string",
    description: "Specify a custom .env file path",
    default: ".env",
  })
  .option("use-dotenv", {
    alias: "d",
    type: "boolean",
    description: "Specify if you want to use dotenv for env parsing",
    default: false,
  })
  .parse();

async function main() {
  try {
    let envPath: string;
    let useDotEnv: boolean;
    let parsedArgV = argv;
    if (parsedArgV instanceof Promise) {
      parsedArgV = await argv;
      envPath = parsedArgV.file;
      useDotEnv = parsedArgV.useDotenv;
    } else {
      envPath = parsedArgV.file;
      useDotEnv = parsedArgV.useDotenv;
    }
    const envContent = await fs.readFile(
      path.resolve(process.cwd(), envPath),
      "utf-8",
    );
    if (!useDotEnv) {
      const { dotenv } = await prompts({
        type: "confirm",
        name: "dotenv",
        message: "Do you want to use dotenv?",
        initial: useDotEnv,
      });
      useDotEnv = dotenv;
    }
    const envConfig = dotenv.parse(envContent);

    const zodSchema = generateZodSchema(envConfig);
    const options = {
      envPath,
      useDotEnv,
    };
    const configContent = generateConfigFile(zodSchema, options);

    await fs.writeFile(path.resolve(process.cwd(), "config.ts"), configContent);
    console.log("config.ts file has been created successfully.");

    //Ask if they want to instal zod
    const packageManager = await getPackageManager();
    const dependencies = ["zod", ...(useDotEnv ? ["dotenv"] : [])];
    const shouldInstallDependencies = await askToInstallDependencies();
    if (shouldInstallDependencies) {
      await installDependencies(packageManager, dependencies);
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
    } else if (!isNaN(Number(value))) {
      zodType = "z.coerce.number()";
    }
    return `  ${key}: ${zodType},`;
  });

  return `z.object({\n${schemaLines.join("\n")}\n})`;
}

function isUrl(str: string): boolean {
  const { success } = z.string().url().safeParse(str);
  return success;
}

function generateConfigFile(
  zodSchema: string,
  options: { envPath: string; useDotEnv: boolean },
): string {
  const { envPath, useDotEnv } = options;
  return `import { z } from 'zod';${
    useDotEnv ? `\nimport { config as dotenvConfig } from "dotenv";\n` : ""
  }${
    useDotEnv
      ? envPath === ".env"
        ? `dotenvConfig();`
        : `dotenvConfig({ path: ${JSON.stringify(envPath)} });`
      : ""
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

async function installDependencies(
  packageManager: string,
  dependencies: string[],
): Promise<void> {
  console.log(
    `Installing packages ${dependencies.join(", ")} using ${packageManager}...`,
  );
  const packagesString = dependencies.join(" ");
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
