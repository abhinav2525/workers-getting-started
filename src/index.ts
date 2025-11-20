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

import { WorkerEntrypoint } from "cloudflare:workers";
import { Hono } from "hono";

export interface Env {
	AI: Ai;
	MY_KV: KVNamespace;
	movieDB: D1Database;
}

export class MoviesService extends WorkerEntrypoint {
	async getMovies() {
	  const query = "select * from movies";
	  // @ts-expect-error
	  const { results: movies } = await this.env.movieDB
		.prepare(query)
		.all();
	  return movies;
	};
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

  app.get("/movies", async (c) => {
	const { results: movies } = await c.env.movieDB.prepare("select * from movie")
	  .all();
	return c.json(movies);
  });
  
  app.get("/favorites", async (c) => {
	const { results: favorites } = await c.env.movieDB.prepare(
	  "select * from movie order by rating desc limit 3",
	).all();
	return c.json(favorites);
  });
  
  app.post("/movies/:id", async (c) => {
	const body = await c.req.json();
	const result = await c.env.movieDB.prepare(
	  "UPDATE movie SET rating = ?1 WHERE id = ?2 RETURNING *",
	).bind(body.rating, c.req.param("id")).run();
	const ok = result.success;
	return c.json({ ok });
  });

export default app;
