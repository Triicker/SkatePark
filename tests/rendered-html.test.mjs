import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("bundles the complete island environment", async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const pageAsset = (await readdir(assetsDirectory)).find((name) =>
    /^page-.*\.js$/.test(name),
  );

  assert.ok(pageAsset, "expected a built page client asset");
  const bundle = await readFile(new URL(pageAsset, assetsDirectory), "utf8");

  for (const sceneFeature of [
    "island-coast",
    "island-pier",
    "ocean-surface",
    "ocean-wave-details",
  ]) {
    assert.match(bundle, new RegExp(sceneFeature), `${sceneFeature} is missing`);
  }
});
