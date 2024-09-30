# Typesafe Env

Create a type-safe config from your `.env` file.

## Usage

```bash
npx gen-typed-env --file .env
```

> [!NOTE]
> You can omit the `--file` flag if you have a `.env` file in the current directory.

## Example

```.env
USERNAME=Complexlity
PROFILE_URL=https://github.com/Complexlity/typesafe-env/
COMPANYNAME=
```

```bash
npx gen-typed-env
```

Will generate the following file:

```ts
import { z } from "zod";
import { config: dotenvConfig } from "dotenv";

dotenvConfig();

export const env = z.object({
  USERNAME: z.string(),
  PROFILE_URL: z.url(),
  COMPANYNAME: z.string().optional(),
});

const config = env.parse(process.env);

export default config;
```
