import cors from "cors";
import express, { type Express } from "express";

export interface CreateAppOptions {
  now: () => Date;
  seed: number;
}

export function createApp({ now, seed }: CreateAppOptions): Express {
  void now;
  void seed;

  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  return app;
}
