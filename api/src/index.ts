import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import healthRouter from "./routes/health.ts";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/v1/health", healthRouter);

app.listen(PORT, () => {
  console.log(`API Fintrack démarrée sur http://localhost:${PORT}`);
  console.log(`Health : http://localhost:${PORT}/api/v1/health`);
});
