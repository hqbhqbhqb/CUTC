import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import ProfileCard from "../components/profile/ProfileCard";
import ProgressDashboard from "../components/profile/ProgressDashboard";
import TaskSchedule from "../components/profile/TaskSchedule";
import ReminderSettings from "../components/profile/ReminderSettings";
import { useApp } from "../store/useApp";

function Profile() {
  const { user } = useApp();
  if (!user) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-5 py-12 text-center">
        <div className="w-full rounded-[28px] border border-[#dce9e6] bg-white p-9 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f4f1] text-[#28786b]"><LogIn size={26} /></div>
          <h1 className="mt-6 text-2xl font-bold text-[#173f38]">Sign in to view your profile</h1>
          <p className="mt-2 text-sm leading-6 text-[#71827e]">The medication schedule remains on this device, but personal details are only shown after sign-in.</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-[#2d7a6d] px-6 py-3 text-sm font-bold text-white">Go to sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-9">
        <p className="text-xs font-bold tracking-[0.18em] text-[#2d7a6d]">PROFILE & PROGRESS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173f38]">Hello, {user.username}</h1>
        <p className="mt-2 text-sm text-[#71827e]">Manage your profile, medication schedule, and skin-care streak.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[330px_1fr]">
        <ProfileCard />
        <div className="space-y-6"><ProgressDashboard /><TaskSchedule /><ReminderSettings /></div>
      </div>
    </main>
  );
}

export default Profile;
