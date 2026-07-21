import Link from "next/link"
import {
  HeartPulse,
  Globe,
  ArrowRight,
  Star,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Users,
  Play,
  Smartphone,
} from "lucide-react"

const whyFeatures = [
  "Easy to use for both parties",
  "Direct communication between users and service providers",
  "Comprehensive organization of all medical operations",
  "Continuous technical support to ensure smooth operation",
]

const userJourney = [
  "Sign up on the App",
  "Browse medical services",
  "View provider profiles",
  "Book an appointment or request a home visit",
  "Receive notifications and reminders",
  "Rating service",
]

const providerJourney = [
  "Register as a service provider",
  "Set up your profile and services",
  "Receive booking requests",
  "Manage appointments and patients",
  "Communicate directly with your users",
  "Grow with reviews and insights",
]

function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-orange-400/80" />
    </span>
  )
}

export default function Home() {
  return (
    <div dir="ltr" className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <HeartPulse className="h-7 w-7 text-brand-500" />
            Life <span className="text-brand-500">ID</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Join as service provider
            </Link>
            <button className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <Globe className="h-4 w-4" /> En
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-brand-50">
        <div className="mx-auto max-w-6xl px-6 pt-16 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            A Comprehensive Medical System for Everyone – Users and Service Providers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
            Life ID combines an easy-to-use app for users with a powerful dashboard for
            managing clinics, hospitals, pharmacies, and more.
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600"
            >
              Join as service provider now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Hero mockup */}
        <div className="relative mx-auto mt-12 max-w-4xl px-6 pb-20">
          <div className="relative flex items-end justify-center">
            {/* Dashboard window */}
            <div className="w-full rounded-2xl border border-black/5 bg-white shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex">
                <aside className="hidden w-44 flex-col gap-1.5 border-r border-black/5 p-4 sm:flex">
                  <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
                    <HeartPulse className="h-4 w-4 text-brand-500" /> Life ID
                  </div>
                  <div className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white">
                    Dashboard
                  </div>
                  {["Doctors", "Pharmacies", "Representations", "Medicines", "Admins", "Partnerships"].map(
                    (i) => (
                      <div key={i} className="px-3 py-1.5 text-xs text-slate-500">
                        {i}
                      </div>
                    ),
                  )}
                </aside>
                <div className="flex-1 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["Revenue", "900,000 EGP"],
                      ["Doctor's Commission", "3,000 EGP"],
                      ["Pharmacy's Commission", "3,000 EGP"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-brand-50 p-3">
                        <div className="text-[10px] font-medium text-slate-500">{label}</div>
                        <div className="mt-1 text-sm font-bold text-brand-700">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-end gap-2 rounded-xl border border-black/5 p-4">
                    {[40, 65, 50, 80, 55, 90, 70, 60, 85, 45, 75, 95].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-full rounded-t bg-gradient-to-t from-brand-500 to-brand-300"
                        style={{ height: h + "px" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="relative -ml-12 hidden h-72 w-40 shrink-0 items-center justify-center rounded-[2rem] border-4 border-slate-900 bg-gradient-to-b from-brand-50 to-white shadow-2xl md:flex">
              <div className="flex flex-col items-center gap-1 font-display font-extrabold text-brand-500">
                <HeartPulse className="h-9 w-9" />
                Life ID
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-extrabold">
          About <Underline>Life ID</Underline>
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-slate-500">
          Life ID is a comprehensive digital healthcare system developed to bridge the gap
          between users and medical service providers by offering modern, technology-driven
          solutions that meet today’s needs.
        </p>
      </section>

      {/* Mission + Why + stats */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-2xl font-extrabold">
            🎯 Mission
          </h3>
          <p className="mt-3 text-slate-500">
            To become the leading platform that transforms the way people access healthcare
            by providing smart tools that simplify communication, management, and access to
            medical services.
          </p>

          <h3 className="mt-8 flex items-center gap-2 font-display text-2xl font-extrabold">
            💡 Why Life ID?
          </h3>
          <div className="mt-4 space-y-3">
            {whyFeatures.map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-sm text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats graphic */}
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-orange-100/70 blur-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-center rounded-2xl bg-brand-500 p-6 text-white shadow-lg">
              <Stethoscope className="h-8 w-8" />
              <div className="mt-3 text-3xl font-extrabold">30k</div>
              <div className="text-sm text-white/80">Professional service providers</div>
            </div>
            <div className="mt-8 flex flex-col justify-center rounded-2xl bg-orange-400 p-6 text-white shadow-lg">
              <Users className="h-8 w-8" />
              <div className="mt-3 text-3xl font-extrabold">30k</div>
              <div className="text-sm text-white/90">Patients</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-extrabold">
            How it <Underline>work?</Underline>
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <JourneyCard title="User journey" steps={userJourney} highlighted />
            <JourneyCard title="Service provider journey" steps={providerJourney} />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-extrabold">
          What Our Users Say <Underline>About Us</Underline>
        </h2>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 text-slate-400">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="max-w-xl rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
            <p className="text-sm leading-relaxed text-slate-600">
              Life ID has completely transformed how I manage my clinic. The platform is
              intuitive, and I can easily track appointments, patient records, and even
              communicate with patients directly. It saves me time and helps me focus more on
              care, not paperwork. Highly recommended for any healthcare provider looking to
              grow and streamline their practice.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                LA
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Lina Ahmed</div>
                <div className="text-xs text-slate-400">Doctor</div>
              </div>
            </div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Download app */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 font-display font-extrabold text-brand-700">
                <HeartPulse className="h-6 w-6 text-brand-500" /> Life ID
              </div>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Download Our Health App
              </h2>
              <div className="mt-3 flex items-center gap-1 text-orange-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-orange-400" />
                ))}
                <span className="ml-2 text-sm text-slate-500">Rate : 5.0</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Download and register now — whether you are a service provider or a user, you
                can use the app.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  <Play className="h-5 w-5" /> Google Play
                </a>
                <a className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  <Smartphone className="h-5 w-5" /> App Store
                </a>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <div className="h-64 w-36 rounded-[2rem] border-4 border-slate-900 bg-white shadow-xl" />
              <div className="mt-8 flex h-64 w-36 items-center justify-center rounded-[2rem] border-4 border-slate-900 bg-brand-500 shadow-xl">
                <HeartPulse className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold">
              We’re Here <Underline>to Help</Underline>
            </h2>
            <p className="mt-4 max-w-sm text-slate-500">
              Whether you’re a user or a service provider, we’re here to help you get the most
              out of Life ID.
            </p>
            <div className="mt-6 rounded-2xl border border-black/5 p-6 shadow-sm">
              <div className="font-display font-bold">Quick Contact</div>
              <div className="mt-4 flex items-center gap-2 text-sm text-brand-600">
                <Phone className="h-4 w-4" /> 012 5555 55
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-brand-600">
                <Mail className="h-4 w-4" /> hello@lifeid.app
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 p-6 shadow-sm">
            <div className="font-display text-xl font-bold">Reach Out Anytime</div>
            <p className="mt-1 text-sm text-slate-500">
              We’d love to hear from you. Send us a message and we’ll get back to you shortly.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Email" placeholder="Enter your email" />
              <Field label="Phone number" placeholder="Enter your number" />
              <div className="sm:col-span-2">
                <Field label="Name" placeholder="Enter your name" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500">Message</label>
                <textarea
                  rows={4}
                  placeholder="Enter your message"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>
            </div>
            <button className="mt-5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Send message
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-800 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 font-display font-extrabold">
            <HeartPulse className="h-6 w-6" /> Life ID
          </div>
          <div className="text-sm text-white/70">All rights reserved © 2025 Life ID.</div>
        </div>
      </footer>
    </div>
  )
}

function JourneyCard({
  title,
  steps,
  highlighted,
}: {
  title: string
  steps: string[]
  highlighted?: boolean
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div
        className={
          "inline-flex rounded-xl px-4 py-2 font-display font-bold " +
          (highlighted ? "bg-brand-500 text-white" : "border border-brand-500 text-brand-600")
        }
      >
        {title}
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-500">
              {i + 1}
            </span>
            <span className="text-sm text-slate-600">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </div>
  )
}
