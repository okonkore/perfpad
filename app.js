const staticFiles = new Map([
  ["/", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/index.html", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/client.js", { path: "client.js", contentType: "application/javascript; charset=utf-8" }],
  ["/styles.css", { path: "styles.css", contentType: "text/css; charset=utf-8" }],
]);

const fileCache = new Map();
const kv = typeof Deno.openKv === "function" ? await Deno.openKv() : null;
const maxRequestBytes = 2_000_000;
const layoutIndexKey = ["layoutIndex"];

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
    if (!kv) throw httpError(503, "Deno KVが有効ではありません。Deno Deployの起動設定でKVを有効にしてください。");

    if (url.pathname === "/api/debug") return json(await debugKv());

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
  const index = await getLayoutIndex();
  const layouts = index.layouts || [];
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
  await commitKv(kv.atomic()
    .set(["layouts", saved.id], saved)
    .set(layoutIndexKey, upsertLayoutSummary(await getLayoutIndex(), saved)));
  await verifyLayoutSaved(saved.id);
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
  await commitKv(kv.atomic()
    .set(["layouts", id], saved)
    .set(layoutIndexKey, upsertLayoutSummary(await getLayoutIndex(), saved)));
  await verifyLayoutSaved(saved.id);
  return saved;
}

async function deleteLayout(id) {
  await commitKv(kv.atomic()
    .delete(["layouts", id])
    .set(layoutIndexKey, removeLayoutSummary(await getLayoutIndex(), id)));
}

async function commitKv(operation) {
  const result = await operation.commit();
  if (!result.ok) throw httpError(500, "Deno KVへの保存に失敗しました。");
  return result;
}

async function verifyLayoutSaved(id) {
  const entry = await kv.get(["layouts", id], { consistency: "strong" });
  if (!entry.value) throw httpError(500, "保存確認に失敗しました。Deno KVが永続化されていない可能性があります。");
}

async function getLayoutIndex() {
  const entry = await kv.get(layoutIndexKey, { consistency: "strong" });
  return entry.value && Array.isArray(entry.value.layouts) ? entry.value : { layouts: [] };
}

function upsertLayoutSummary(index, layout) {
  const summary = layoutSummary(layout);
  const layouts = [summary, ...(index.layouts || []).filter((item) => item.id !== layout.id)];
  return { layouts };
}

function removeLayoutSummary(index, id) {
  return { layouts: (index.layouts || []).filter((item) => item.id !== id) };
}

function layoutSummary(layout) {
  return {
    id: layout.id,
    name: layout.name,
    itemCount: layout.items?.length || 0,
    updatedAt: layout.updatedAt,
    createdAt: layout.createdAt,
  };
}

async function debugKv() {
  let storedLayoutCount = 0;
  for await (const _entry of kv.list({ prefix: ["layouts"] }, { consistency: "strong" })) {
    storedLayoutCount += 1;
  }
  const index = await getLayoutIndex();
  return {
    kvAvailable: Boolean(kv),
    indexedLayoutCount: index.layouts?.length || 0,
    storedLayoutCount,
    now: new Date().toISOString(),
  };
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
