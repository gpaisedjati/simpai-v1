import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url?.split("?")[0]}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ limit: "1000mb", extended: true }));

app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error) {
    res.status((err as any).status || 500).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

if (!process.env.VERCEL) {
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const rootDir = process.cwd().endsWith("api-server")
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
  const frontendDistPath = path.resolve(rootDir, "artifacts/simpai/dist/public");
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

export default app;
