"use client";

import { MessageCircle, Shield, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="w-full h-full flex flex-col text-gray-800">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/60 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
          <span className="inline-block size-2 rounded-full bg-blue-500" />
          MedGPT Clinical AI
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 max-w-4xl leading-tight">
          Smarter Medical Conversations, Powered by
          <span className="ml-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base sm:text-lg text-gray-600">
          Your trusted MedGPT assistant for guidelines, drug interactions, and
          evidence-based recommendations — always at your fingertips.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm ring-1 ring-blue-500/20 transition-all hover:translate-y-[-1px] hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Start Chatting <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/learn-more"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Learn More
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 py-16 border-t border-gray-200/70 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">Clinical Guidance</h3>
            <p className="mt-2 text-sm text-gray-600">
              Access up-to-date guidelines for treatment, diagnosis, and patient
              management.
            </p>
          </div>
          <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">Safe & Secure</h3>
            <p className="mt-2 text-sm text-gray-600">
              HIPAA-conscious architecture to keep your conversations private
              and secure.
            </p>
          </div>
          <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">Conversational AI</h3>
            <p className="mt-2 text-sm text-gray-600">
              Ask questions naturally and get context-aware, medically relevant
              answers instantly.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-gradient-to-b from-white/70 to-blue-50/50 border-t border-gray-200/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center">
            How it works
          </h2>
          <p className="mt-3 text-gray-600 text-center max-w-3xl mx-auto">
            Upload clinical content, we structure it into a graph and vectors,
            then answer with citations you can trust.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: 1,
                title: "Ingest",
                desc: "Securely upload PDFs/markdown. We parse and clean the content for consistency.",
              },
              {
                step: 2,
                title: "Index",
                desc: "Build a knowledge graph and vector index for fast, accurate retrieval.",
              },
              {
                step: 3,
                title: "Answer",
                desc: "Ask questions naturally and get sourced, explainable responses.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={title}
                className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="absolute -top-3 left-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Step {step}
                </div>
                <h3 className="font-semibold text-gray-900 mt-2">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 py-16 bg-white border-t border-gray-200/70">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center">
            Built for real clinical workflows
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Point‑of‑care FAQs",
                desc: "Get quick, sourced answers for dosing, indications, and contraindications.",
              },
              {
                title: "Guideline lookup",
                desc: "Navigate complex guidelines with concise summaries and citations.",
              },
              {
                title: "Interaction checks",
                desc: "Ask about potential drug–drug interactions with references.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-14 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-semibold">
            Ready to try MedGPT?
          </h3>
          <p className="mt-2 text-blue-100 max-w-2xl">
            Start a conversation and experience fast, cited, and clinically
            grounded answers.
          </p>
          <div className="mt-6">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-blue-700 shadow-sm ring-1 ring-white/30 transition-all hover:bg-blue-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Start Chatting <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
