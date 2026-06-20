const staticFiles = new Map([
  ["/", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/index.html", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/client.js", { path: "client.js", contentType: "application/javascript; charset=utf-8" }],
  ["/styles.css", { path: "styles.css", contentType: "text/css; charset=utf-8" }],
]);

const fileCache = new Map();
const kv = await Deno.openKv();
const maxRequestBytes = 2_000_000;

Deno.serve(async (request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return apiResponse(request, url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const entry = staticFiles.get(url.pathname) || staticFiles.get("/");
  const body = request.method === "HEAD" ? null : await readStaticFile(entry.path);

  return new Response(body, {
    headers: {
      "content-type": entry.contentType,
      "cache-control": entry.path === "index.html" ? "no-cache" : "public, max-age=3600",
    },
  });
});

async function readStaticFile(path) {
  const cached = fileCache.get(path);
  if (cached) return cached;

  const file = await Deno.readFile(new URL(`./${path}`, import.meta.url));
  fileCache.set(path, file);
  return file;
}

async function apiResponse(request, url) {
  try {
    if (url.pathname === "/api/layouts") {
      if (request.method === "GET") return json(await listLayouts());
      if (request.method === "POST") return json(await createLayout(await readJson(request)), { status: 201 });
    }

    const layoutMatch = url.pathname.match(/^\/api\/layouts\/([^/]+)$/);
    if (layoutMatch) {
      const id = decodeURIComponent(layoutMatch[1]);
      if (request.method === "GET") return json(await getLayout(id));
      if (request.method === "PUT") return json(await updateLayout(id, await readJson(request)));
      if (request.method === "DELETE") {
        await deleteLayout(id);
        return json({ ok: true });
      }
    }

    return json({ error: "Not Found" }, { status: 404 });
  } catch (error) {
    const status = error.status || 500;
    return json({ error: error.message || "Server Error" }, { status });
  }
}

async function listLayouts() {
  const layouts = [];
  for await (const entry of kv.list({ prefix: ["layouts"] })) {
    const value = entry.value;
    layouts.push({
      id: value.id,
      name: value.name,
      itemCount: value.items?.length || 0,
      updatedAt: value.updatedAt,
      createdAt: value.createdAt,
    });
  }
  layouts.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { layouts };
}

async function getLayout(id) {
  const entry = await kv.get(["layouts", id]);
  if (!entry.value) throw httpError(404, "保存データが見つかりません。");
  return entry.value;
}

async function createLayout(input) {
  const now = new Date().toISOString();
  const layout = normalizeLayout(input);
  const saved = {
    id: crypto.randomUUID(),
    name: layout.name,
    board: layout.board,
    items: layout.items,
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(["layouts", saved.id], saved);
  return saved;
}

async function updateLayout(id, input) {
  const current = await getLayout(id);
  const layout = normalizeLayout(input);
  const saved = {
    ...current,
    name: layout.name,
    board: layout.board,
    items: layout.items,
    updatedAt: new Date().toISOString(),
  };
  await kv.set(["layouts", id], saved);
  return saved;
}

async function deleteLayout(id) {
  await kv.delete(["layouts", id]);
}

function normalizeLayout(input) {
  const name = String(input?.name || "").trim().slice(0, 80);
  if (!name) throw httpError(400, "名前を入力してください。");
  if (!input?.board || typeof input.board !== "object") throw httpError(400, "基板データがありません。");
  if (!Array.isArray(input.items)) throw httpError(400, "部品データがありません。");
  if (input.items.length > 2000) throw httpError(400, "部品数が多すぎます。");
  return {
    name,
    board: input.board,
    items: input.items,
  };
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > maxRequestBytes) throw httpError(413, "保存データが大きすぎます。");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw httpError(400, "JSONを読み込めません。");
  }
}

function json(value, options = {}) {
  return new Response(JSON.stringify(value), {
    status: options.status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
