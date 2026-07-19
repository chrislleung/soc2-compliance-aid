import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { NextRequest } from "next/server";

import type { AuditorExportResponse } from "@/lib/contracts";
import { GET } from "@/app/api/auditor/export/route";

const REQUIRED_FILENAMES = [
  "README.txt",
  "controls.json",
  "evidence.json",
  "employees.csv",
  "policies.csv",
  "policy-acknowledgements.csv",
  "risks.csv",
  "connector-sync-history.json",
];

const JSON_FILENAMES = ["controls.json", "evidence.json", "connector-sync-history.json"];
const CSV_FILENAMES = ["employees.csv", "policies.csv", "policy-acknowledgements.csv", "risks.csv"];

describe("auditor export", () => {
  it("returns a JSON manifest matching the shared contract by default", async () => {
    const response = GET(new NextRequest("http://localhost/api/auditor/export"));
    const body = (await response.json()) as AuditorExportResponse;

    assert.equal(response.status, 200);
    assert.equal(body.format, "zip");
    assert.equal(body.downloadUrl, "/api/auditor/export?format=zip");
    assert.ok(body.manifest.length > 0);
    assert.ok(body.manifest.every((entry) => typeof entry.evidenceId === "string"));
  });

  it("rejects an unsupported format value", () => {
    const response = GET(new NextRequest("http://localhost/api/auditor/export?format=csv"));

    assert.equal(response.status, 400);
  });

  it("generates a downloadable ZIP containing the required files at ?format=zip", async () => {
    const response = GET(new NextRequest("http://localhost/api/auditor/export?format=zip"));
    const zipBuffer = Buffer.from(await response.arrayBuffer());
    const entries = readZipEntries(zipBuffer);
    const filenames = Array.from(entries.keys());

    assert.equal(response.headers.get("Content-Type"), "application/zip");
    assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="soc2-audit-package.zip"');
    assert.ok(zipBuffer.length > 0);

    for (const filename of REQUIRED_FILENAMES) {
      assert.ok(filenames.includes(filename), `${filename} should exist in export ZIP`);
    }

    for (const filename of JSON_FILENAMES) {
      assert.doesNotThrow(() => JSON.parse(requiredEntry(entries, filename)));
    }

    for (const filename of CSV_FILENAMES) {
      const firstLine = requiredEntry(entries, filename).split(/\r?\n/, 1)[0];

      assert.ok(firstLine && firstLine.includes(","), `${filename} should contain a CSV header row`);
    }
  });
});

function readZipEntries(zipBuffer: Buffer): Map<string, string> {
  const endOfCentralDirectoryOffset = zipBuffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

  assert.notEqual(endOfCentralDirectoryOffset, -1, "ZIP end-of-central-directory record should exist");

  const entryCount = zipBuffer.readUInt16LE(endOfCentralDirectoryOffset + 10);
  let offset = zipBuffer.readUInt32LE(endOfCentralDirectoryOffset + 16);
  const entries = new Map<string, string>();

  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(zipBuffer.readUInt32LE(offset), 0x02014b50, "central directory header should be valid");

    const nameLength = zipBuffer.readUInt16LE(offset + 28);
    const extraLength = zipBuffer.readUInt16LE(offset + 30);
    const commentLength = zipBuffer.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    const filename = zipBuffer.toString("utf8", nameStart, nameEnd);

    assert.equal(zipBuffer.readUInt32LE(localHeaderOffset), 0x04034b50, "local file header should be valid");

    const compressedSize = zipBuffer.readUInt32LE(localHeaderOffset + 18);
    const localNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;

    entries.set(filename, zipBuffer.toString("utf8", dataStart, dataEnd));
    offset = nameEnd + extraLength + commentLength;
  }

  return entries;
}

function requiredEntry(entries: Map<string, string>, filename: string): string {
  const entry = entries.get(filename);

  if (entry === undefined) {
    assert.fail(`${filename} should exist in export ZIP`);
  }

  return entry;
}
