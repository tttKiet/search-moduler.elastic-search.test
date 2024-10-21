import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { setUpRoute } from './route/index.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


setUpRoute(app);

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
