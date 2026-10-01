import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { preSendErrorCode, withPreSendRetry } from "./retry-fetch.ts";

const fetchFailed = (code: string) => new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
const noSleep = async () => {};

describe("preSendErrorCode", () => {
  it("recognises DNS and connect-phase failures, including AggregateError causes", () => {
    assert.equal(preSendErrorCode(fetchFailed("EAI_AGAIN")), "EAI_AGAIN");
    assert.equal(preSendErrorCode(fetchFailed("ENOTFOUND")), "ENOTFOUND");
    const agg = new TypeError("fetch failed", {
      cause: new AggregateError([Object.assign(new Error(), { code: "ECONNREFUSED" })]),
    });
    assert.equal(preSendErrorCode(agg), "ECONNREFUSED");
  });

  it("ignores errors that may have happened after the request was sent", () => {
    assert.equal(preSendErrorCode(fetchFailed("ECONNRESET")), null);
    assert.equal(preSendErrorCode(fetchFailed("UND_ERR_SOCKET")), null);
    assert.equal(preSendErrorCode(new Error("SQL error")), null);
    assert.equal(preSendErrorCode("nope"), null);
  });
});

describe("withPreSendRetry", () => {
  it("retries a DNS failure and returns the eventual response", async () => {
    let calls = 0;
    const retries: string[] = [];
    const f = withPreSendRetry(
      async () => {
        calls++;
        if (calls < 3) throw fetchFailed("EAI_AGAIN");
        return new Response("ok");
      },
      { sleep: noSleep, onRetry: (code) => retries.push(code) },
    );
    const res = await f("https://example.test");
    assert.equal(await res.text(), "ok");
    assert.equal(calls, 3);
    assert.deepEqual(retries, ["EAI_AGAIN", "EAI_AGAIN"]);
  });

  it("gives up after the configured attempts and rethrows the last error", async () => {
    let calls = 0;
    const f = withPreSendRetry(
      async () => {
        calls++;
        throw fetchFailed("ENOTFOUND");
      },
      { sleep: noSleep },
    );
    await assert.rejects(f("https://example.test"), /fetch failed/);
    assert.equal(calls, 3);
  });

  it("does not retry mid-flight or application errors", async () => {
    let calls = 0;
    const f = withPreSendRetry(
      async () => {
        calls++;
        throw fetchFailed("ECONNRESET");
      },
      { sleep: noSleep },
    );
    await assert.rejects(f("https://example.test"));
    assert.equal(calls, 1);
  });
});
