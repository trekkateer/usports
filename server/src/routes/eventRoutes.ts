import { Router } from "express";
import { getRequestUserId } from "../auth/requestUser";
import {
  createEvent,
  deleteHostedEvent,
  getEvent,
  joinEvent,
  leaveEvent,
  listEvents,
  updateHostedEvent,
} from "../services/eventService";
import { UpdateEventInput } from "../types/event";

// Routes only translate HTTP into service calls. The rules live in the event service,
// and errors it throws are turned into status codes by the error handler in app.ts.
const router = Router();


router.get("/", async (request, response) => {
  response.status(200).json(await listEvents(request.query));
});

router.get("/:id", async (request, response) => {
  response.status(200).json(await getEvent(request.params.id));
});

router.post("/", async (request, response) => {
  const userId = await getRequestUserId(request);
  response.status(201).json(await createEvent(request.body, userId));
});

router.patch("/:id", async (request, response) => {
  const updates = request.body as UpdateEventInput;

  if (!updates || typeof updates !== "object") {
    response.status(400).json({ error: "Invalid event data" });
    return;
  }

  const userId = await getRequestUserId(request);
  const event = await updateHostedEvent(request.params.id, updates, userId);
  response.status(200).json(event);
});

router.delete("/:id", async (request, response) => {
  const userId = await getRequestUserId(request);
  await deleteHostedEvent(request.params.id, userId);
  response.status(204).send();
});

router.post("/:id/join", async (request, response) => {
  // Who joins comes from their sign-in token (401 if there's no valid one)
  response.status(200).json(await joinEvent(request.params.id, await getRequestUserId(request)));
});

router.delete("/:id/join", async (request, response) => {
  // Who leaves comes from their sign-in token (401 if there's no valid one)
  response.status(200).json(await leaveEvent(request.params.id, await getRequestUserId(request)));
});

export default router;
