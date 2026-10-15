"use client";

import { useState, type FormEvent } from "react";

export default function EnquirePage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No CRM/lead-routing endpoint has been confirmed yet (requirements.md §9).
    // This client-side placeholder confirms the UI flow without inventing a
    // backend. Wire a real endpoint here once one is provided.
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold">Enquire Now</h1>
      <p className="mt-3 text-stone-600">
        Share your details and our team will get back to you about Sobha Neopolis.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
          Thanks — your enquiry details were captured in this preview form. A live CRM endpoint is not yet connected
          (see requirements.md §9); once one is provided, submissions here will route to it automatically.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Full name
            </label>
            <input id="name" name="name" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <input id="phone" name="phone" type="tel" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea id="message" name="message" rows={4} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
          </div>
          <button
            type="submit"
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Submit Enquiry
          </button>
        </form>
      )}
    </div>
  );
}
