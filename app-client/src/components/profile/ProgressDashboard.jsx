import Card from "../common/Card";
import ProgressBar from "../common/ProgressBar";

function ProgressDashboard() {
  const days = [
    true,
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div>
          <h2 className="text-lg font-bold">Tiến độ điều trị</h2>

          <p className="mt-1 text-sm text-[#71827E]">
            Theo dõi mức độ hoàn thành trong tháng
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold text-[#2D7A6D]">82%</p>

          <p className="text-xs text-[#879691]">hoàn thành</p>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar value={82} />
      </div>

      <div className="mt-7">
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15 md:grid-cols-[repeat(15,minmax(0,1fr))]">
          {days.map((completed, index) => (
            <div
              key={index}
              className={`aspect-square rounded-sm ${
                completed ? "bg-[#4D9587]" : "bg-[#E7EFED]"
              }`}
              title={`Ngày ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-between text-xs text-[#879691]">
        <span>30 ngày trước</span>
        <span>Hôm nay</span>
      </div>
    </Card>
  );
}

export default ProgressDashboard;
