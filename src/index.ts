/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from "hono";

export interface Env {
	AI: Ai;
	MY_KV: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {

	const content = c.req.query("query") || 'What is the origin of the phrase Hello, World'

	const messages: RoleScopedChatInput[] = [
	  { role: 'system', content: 'You are a friendly assistant' },
	  { role: 'user', content }
	];

	const answer = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
	return c.json({ message: "Hello,44vibe!", ai_response: answer });
});

app.get("/repos/:username", async (c) => {
	const username = c.req.param("username");
	const cached = await c.env.MY_KV.get(`repos:${username}`, "json");
  
	if (cached) {
	  return c.json(cached);
	} else {
	  const resp = await fetch(`https://api.github.com/users/${username}/repos`, {
		headers: {
		  "User-Agent": "CF Workers",
		},
	  });
	  const data = await resp.json();
	  await c.env.MY_KV.put(`repos:${username}`, JSON.stringify(data), {
		expirationTtl: 60,
	  });
	  return c.json(data);
	}
  });

export default app;
