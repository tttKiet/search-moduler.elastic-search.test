import { Hono } from "hono";
import * as userController from "../handle/user.controller.ts";

const route = new Hono();

route.post('/', userController.createUser)
route.get('/')

export default route