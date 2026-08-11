import ProfileCard from "../components/profile/ProfileCard";
import ProgressDashboard from "../components/profile/ProgressDashboard";
import TaskSchedule from "../components/profile/TaskSchedule";

function Profile() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-medium text-[#2D7A6D]">PROFILE</p>

        <h1 className="mt-2 text-3xl font-bold">Xin chào, Alex</h1>

        <p className="mt-2 text-[#71827E]">
          Quản lý thông tin và theo dõi tiến độ của bạn.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ProfileCard />

        <div className="space-y-6">
          <ProgressDashboard />

          <TaskSchedule />
        </div>
      </div>
    </main>
  );
}

export default Profile;
