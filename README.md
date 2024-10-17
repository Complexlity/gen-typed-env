# Generate Typed Env

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
PROFILE_URL=https://github.com/Complexlity/gen-typed-env/
COMPANYNAME=
NUMBER_OF_LIVES=9
```

```bash
npx gen-typed-env
```

Will generate the following file:

```ts
import { z } from "zod";

export const env = z.object({
  USERNAME: z.string(),
  PROFILE_URL: z.url(),
  COMPANYNAME: z.string().optional(),
  NUMBER_OF_LIVES: z.coerce.number(),
});

const config = env.parse(process.env);

export default config;
```


## Options
You can pass two more options
1. `--file` to specify the file name
Usage: `npx gen-typed-env --file .env.test`

2. `--use-dotenv` to use dotenv instead of the default `process.env`. Comes handy for older node versions that don't support `process.env`
Usage: `npx gen-typed-env --use-dotenv`

### Example

```.env.test
HELLO=https://www.youtube.com/watch?v=dQw4w9WgXcQ
WORLD=
SKILL_LEVEL=9
```

```bash
npx gen-typed-env --file .env.test --use-dotenv
```

Will generate the following file:

```ts
import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.test" });

export const env = z.object({
  HELLO: z.string().url(),
  WORLD: z.string().optional(),
  SKILL_LEVEL: z.coerce.number(),
});

const config = env.parse(process.env);

export default config;
```