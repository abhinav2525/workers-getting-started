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
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
	const answer = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
		prompt: "tell me meaning of 44vibe"
	});
	return c.json({ message: "Hello,44vibe!", ai_response: answer });
});

export default app;
