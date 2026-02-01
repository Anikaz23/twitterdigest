import express from "express";
import cors from "cors";
import digestsRouter from "./routes/digests";

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({
  origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
  methods: ["GET"],
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Digest routes
app.use("/digests", digestsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`CORS origin: ${corsOrigin}`);
});
