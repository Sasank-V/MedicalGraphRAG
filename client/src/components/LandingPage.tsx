"use client";

import { MessageCircle, Shield, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
    return (
        <div className="w-full h-full flex flex-col bg-gray-50 text-gray-800">

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl max-w-3xl leading-tight">
                    Smarter Medical Conversations, Powered by{" "}
                    <span className="text-blue-600">AI</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-gray-600">
                    Your trusted assistant for guidelines, drug interactions,
                    and evidence-based recommendations — always at your
                    fingertips.
                </p>
                <div className="mt-8 flex gap-4">
                    <Link
                        href="/app"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        Start Chatting <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/learn-more"
                        className="px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 shadow-sm transition-colors"
                    >
                        Learn More
                    </Link>
                </div>
            </main>

            {/* Features */}
            <section className="px-6 py-16 border-t border-gray-200 bg-white">
                <div className="max-w-5xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="p-6 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                        <Stethoscope className="w-8 h-8 text-blue-600 mb-4" />
                        <h3 className="font-semibold text-gray-900">
                            Clinical Guidance
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Access up-to-date guidelines for treatment,
                            diagnosis, and patient management.
                        </p>
                    </div>
                    <div className="p-6 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                        <Shield className="w-8 h-8 text-blue-600 mb-4" />
                        <h3 className="font-semibold text-gray-900">
                            Safe & Secure
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            HIPAA-conscious architecture to ensure your
                            conversations remain private and secure.
                        </p>
                    </div>
                    <div className="p-6 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                        <MessageCircle className="w-8 h-8 text-blue-600 mb-4" />
                        <h3 className="font-semibold text-gray-900">
                            Conversational AI
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Ask questions naturally and get context-aware,
                            medically relevant answers instantly.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
