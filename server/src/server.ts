import { createApp } from "./app.js";
import { defaultFixture } from "./default-fixture.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp({
  now: () => new Date(),
  fixture: defaultFixture,
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
