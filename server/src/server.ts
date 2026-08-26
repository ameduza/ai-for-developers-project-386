import { createApp } from './app.js';
import { defaultSeed } from './default-seed.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp({
  now: () => new Date(),
  seed: defaultSeed,
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
