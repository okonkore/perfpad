const staticFiles = new Map([
  ["/", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/index.html", { path: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/app.js", { path: "app.js", contentType: "application/javascript; charset=utf-8" }],
  ["/styles.css", { path: "styles.css", contentType: "text/css; charset=utf-8" }],
]);

const fileCache = new Map<string, Uint8Array>();

Deno.serve(async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const url = new URL(request.url);
  const entry = staticFiles.get(url.pathname) || staticFiles.get("/");
  if (!entry) return new Response("Not Found", { status: 404 });

  const body = request.method === "HEAD" ? null : await readStaticFile(entry.path);
  return new Response(body, {
    headers: {
      "content-type": entry.contentType,
      "cache-control": entry.path === "index.html" ? "no-cache" : "public, max-age=3600",
    },
  });
});

async function readStaticFile(path: string) {
  const cached = fileCache.get(path);
  if (cached) return cached;

  const file = await Deno.readFile(new URL(`./${path}`, import.meta.url));
  fileCache.set(path, file);
  return file;
}
