import React from "react";
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Brain,
  Zap,
  Star,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description:
        "Advanced medical language models trained on extensive clinical literature for precise, context-aware responses.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "HIPAA-compliant infrastructure with end-to-end encryption protecting your sensitive medical data.",
    },
    {
      icon: Zap,
      title: "Instant Insights",
      description:
        "Real-time answers to complex medical queries with comprehensive source citations and references.",
    },
  ];

  const stats = [
    { value: "50,000+", label: "Medical Papers" },
    { value: "99.2%", label: "Accuracy Rate" },
    { value: "<2s", label: "Response Time" },
    { value: "1,200+", label: "Providers" },
  ];

  const testimonials = [
    {
      quote:
        "MedGPT has transformed how I access critical medical information. The speed and reliability are unmatched.",
      author: "Dr. Sarah Chen",
      role: "Emergency Medicine",
    },
    {
      quote:
        "Finally, an AI tool that truly understands medical context and delivers evidence-based information.",
      author: "Dr. Marcus Rodriguez",
      role: "Internal Medicine",
    },
    {
      quote:
        "The citation system gives me confidence in the information, making clinical decisions easier.",
      author: "Dr. Emily Johnson",
      role: "Clinical Research",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">MedGPT</span>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 font-medium mb-8">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Trusted by 1,200+ Healthcare Professionals
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Medical Intelligence,
            <br />
            <span className="text-blue-600">Simplified</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Access evidence-based medical information instantly with AI-powered
            precision. Every answer backed by peer-reviewed sources.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-all">
              Watch Demo
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              SOC 2 Certified
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              FDA Guidelines
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Healthcare Professionals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to enhance your clinical workflow and
              decision-making
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Medical Experts
            </h2>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-2 text-gray-600">4.9 out of 5 stars</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare professionals using MedGPT to deliver
              better patient care.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
              Start Your Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-blue-100 text-sm mt-4">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-gray-600 text-sm">
                © 2024 MedGPT. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
