import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Scale } from "lucide-react";

const copy = {
  terms: {
    eyebrow: "TERMS & CONDITIONS",
    title: "Điều khoản sử dụng",
    icon: Scale,
    sections: [
      ["Mục đích", "DermaCare là công cụ hỗ trợ nhắc lịch và hướng dẫn vị trí bôi thuốc. Ứng dụng không chẩn đoán bệnh và không thay thế bác sĩ."],
      ["Sử dụng an toàn", "Chỉ dùng thuốc theo chỉ định của bác sĩ. Dừng sử dụng và liên hệ cơ sở y tế nếu có kích ứng, đau, khó chịu hoặc triệu chứng bất thường."],
      ["Giới hạn bản demo", "Nhận diện vùng da sáng dựa trên hình ảnh camera có thể sai do ánh sáng, màu da, chất lượng camera hoặc bệnh lý khác. Người dùng phải kiểm tra lại trước khi bôi."],
    ],
  },
  privacy: {
    eyebrow: "PRIVACY POLICY",
    title: "Chính sách quyền riêng tư",
    icon: LockKeyhole,
    sections: [
      ["Xử lý tại thiết bị", "Trong bản MVP này, khung hình camera được xử lý trực tiếp trong trình duyệt và không được tải lên máy chủ."],
      ["Dữ liệu tài khoản", "Hồ sơ, lịch thuốc và tiến độ được lưu trong localStorage của chính trình duyệt. Xóa dữ liệu trình duyệt sẽ xóa dữ liệu bản demo."],
      ["Khi triển khai thật", "Phiên bản sản xuất cần backend đạt chuẩn bảo mật, mã hóa, kiểm soát truy cập, nhật ký đồng ý và quy trình bảo vệ dữ liệu y tế phù hợp pháp luật."],
    ],
  },
};

function Legal({ type }) {
  const content = copy[type];
  const Icon = content.icon;
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 lg:px-8">
      <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#247568]">
        <ArrowLeft size={17} /> Quay lại đăng ký
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
