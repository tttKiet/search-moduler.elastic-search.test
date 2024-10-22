import { Hono } from "hono";
import * as userController from "../handle/user.controller.ts";

const route = new Hono();

route.get("/search", userController.handleSearchName);
route.get("/get-data-from-index", userController.getDataFromIndex);
route.get("/cat-all-index", userController.catAllIndex);
route.post("/create-index", userController.createIndex);
route.post("/", userController.createUser);
route.get("/");

export default route;
