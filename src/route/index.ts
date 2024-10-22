import type { Hono } from "hono";
import userRoute from "./user.route.ts";

export function setUpRoute(app: Hono) {
  app.get("/", (c) => {
    return c.json(JSON.stringify({ msg: "Hello World!" }));
  });
  app.route("/user", userRoute);
}
