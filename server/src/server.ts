import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp({
  now: () => new Date(),
  seed: 0,
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
