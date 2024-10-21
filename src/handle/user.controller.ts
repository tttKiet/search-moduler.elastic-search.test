import { createMiddleware } from "hono/factory"
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });

interface User {
    name: string,
    old:string
}

const  createUser = createMiddleware( async (c) => {
    const { name, old } = await c.req.json<User>(); 
    try {
        const res = await client.index({
            index: 'users',
            body: {
                name,
                old,
            },
        });
        console.log("res: client.index: ", res);

        return c.json({ ok: 200, message: 'User created successfully' }, 200);
    } catch (error) {
        console.error('Elasticsearch error:', error);
        return c.json({ error: 'Failed to create user' }, 500);
    }

})

export {createUser}

