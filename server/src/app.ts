import express from "express";
import eventRoutes from "./routes/eventRoutes";

export const app = express();

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/events", eventRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found" });
});
