import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { POST as acknowledgePolicy } from "@/app/api/policies/[id]/acknowledge/route";
import { POST as createRisk } from "@/app/api/risks/route";

describe("API request validation", () => {
  it("rejects invalid risk likelihood", async () => {
    const response = await createRisk(
      jsonRequest({
        title: "Invalid likelihood",
        description: "Risk with a bad likelihood value.",
        category: "Security",
        likelihood: "certain",
        impact: "medium",
        owner: "Security",
      }),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "invalid_likelihood");
  });

  it("rejects missing employeeId in acknowledgement requests", async () => {
    const response = await acknowledgePolicy(jsonRequest({}), { params: Promise.resolve({ id: "pol-security" }) });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "invalid_employee_id");
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
