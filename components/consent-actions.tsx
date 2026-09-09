"use client";

import { FormEvent, useRef, useState } from "react";

type Decision = "approve" | "deny";

export function ConsentActions({
  authorizationId,
}: {
  authorizationId: string;
}) {
  const submitted = useRef(false);
  const [submitting, setSubmitting] = useState<Decision | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitted.current) {
      event.preventDefault();
      return;
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const decision =
      submitter instanceof HTMLButtonElement ? submitter.value : "";
    if (decision !== "approve" && decision !== "deny") {
      event.preventDefault();
      return;
    }

    submitted.current = true;
    window.setTimeout(() => setSubmitting(decision), 0);
  }

  return (
    <form
      className="consent-actions"
      action="/api/oauth/decision"
      method="post"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="authorization_id" value={authorizationId} />
      <button
        className="primary-button"
        name="decision"
        value="approve"
        disabled={submitting !== null}
      >
        {submitting === "approve" ? "Continuing…" : "Continue"}
      </button>
      <button
        className="quiet-button"
        name="decision"
        value="deny"
        disabled={submitting !== null}
      >
        {submitting === "deny" ? "Cancelling…" : "Cancel"}
      </button>
    </form>
  );
}
