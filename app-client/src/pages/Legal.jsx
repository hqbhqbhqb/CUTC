import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Scale } from "lucide-react";

const copy = {
  terms: {
    eyebrow: "TERMS & CONDITIONS",
    title: "Terms of Use",
    icon: Scale,
    sections: [
      ["Purpose", "DermaCare provides medication reminders and application guidance. It does not diagnose disease or replace a healthcare professional."],
      ["Safe use", "Only use medication as prescribed. Stop and contact a healthcare professional if irritation, pain, discomfort, or unusual symptoms occur."],
      ["MVP limitations", "Camera-based highlighting may be wrong because of lighting, skin tone, camera quality, scars, or other conditions. Always verify an area before applying medication."],
    ],
  },
  privacy: {
    eyebrow: "PRIVACY POLICY",
    title: "Privacy Policy",
    icon: LockKeyhole,
    sections: [
      ["Camera processing", "Camera frames are processed by the desktop browser and are not saved. When phone pairing is used, the live video is encrypted in transit through WebRTC and PeerJS provides connection signaling metadata."],
      ["Account data", "Profiles, medication schedules, and progress are stored in this browser's localStorage. Clearing browser data removes the demo data."],
      ["Email reminders", "Email reminders are opt-in and require verification of the registered address. When enabled, the verified email, generic reminder content, and delivery times are processed by Brevo. Medication names are omitted unless the user explicitly enables them."],
      ["Third-party services", "PeerJS Cloud is used only to exchange WebRTC connection metadata. Brevo and Vercel process email delivery and server requests when those features are enabled. Camera frames are not intentionally stored by DermaCare."],
      ["Production requirements", "This prototype still needs formal clinical validation, a production identity system, access controls, consent records, and legally compliant health-data safeguards before clinical use."],
    ],
  },
};

function Legal({ type }) {
  const content = copy[type];
  const Icon = content.icon;
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 lg:px-8">
      <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#247568]">
        <ArrowLeft size={17} /> Back to registration
      </Link>
      <div className="mt-7 rounded-[28px] border border-[#dbe9e5] bg-white p-7 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f4f0] text-[#247568]">
          <Icon size={24} />
        </div>
        <p className="mt-7 text-xs font-bold tracking-[0.18em] text-[#247568]">{content.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#173f38]">{content.title}</h1>
        <div className="mt-8 space-y-7">
          {content.sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="font-bold text-[#214d46]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#607873]">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Legal;
