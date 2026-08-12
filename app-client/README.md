# DermaCare Vision

MVP web hỗ trợ người dùng tự bôi thuốc ở vùng lưng bằng camera. Ứng dụng dùng MediaPipe Hand Landmarker để theo dõi đầu ngón trỏ, phân tích chênh lệch màu ngay trong trình duyệt để gợi ý vùng da sáng, phát hướng dẫn bằng Web Speech API và ghi nhận tiến độ dùng thuốc.

> Đây là công cụ hỗ trợ thao tác, không phải thiết bị y tế và không dùng để chẩn đoán lang ben/hắc lào. Việc dùng thuốc phải theo chỉ định của bác sĩ.

## Chức năng

- Đăng ký/đăng nhập cục bộ, điều khoản và chính sách quyền riêng tư.
- Lưu nhiều thuốc bôi/uống, số lần và nhiều khung giờ mỗi ngày.
- Task schedule, chỉnh giờ, đánh dấu hoàn thành và contribution chart 30 ngày.
- Camera chạy MediaPipe Pose + Hand Landmarker trên thiết bị, không upload hay lưu khung hình.
- Chỉ quét sau khi thấy đủ vai–hông và xác nhận người đang quay lưng; đèn/nền sáng không được tạo target nếu thiếu pose hợp lệ.
- Hỗ trợ phác đồ lang ben, hắc lào và mụn lưng; xử lý nửa lưng trái trước rồi nửa phải.
- Hướng dẫn ngón trỏ bằng tiếng Việt, kêu “tít” trong vùng target.
- Hiển thị bản đồ phủ theo hình dạng vùng; chỉ hoàn thành khi phủ ít nhất 90%, tiếp xúc đủ 3 giây và có chuyển động xoa.

## Chạy local

Yêu cầu Node.js 20+ (khuyến nghị Node.js 22 hoặc 24).

```bash
cd app-client
npm install
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173). Có thể dùng pnpm tương đương:

```bash
pnpm install
pnpm dev
```

## Test nhanh

1. Đăng ký một tài khoản demo và đồng ý điều khoản.
2. Ở trang chủ, chọn bệnh và thêm ít nhất một thuốc bôi; chọn số lần/ngày để nhập từng khung giờ.
3. Nhấn **Xong** để xem task hôm nay, hoặc mở **Profile** để chỉnh giờ và đánh dấu tiến độ.
4. Mở **AI Assistant** → **Bắt đầu và bật giọng nói** → cho phép camera.
5. Đặt camera/laptop sao cho toàn bộ lưng nằm trong đường nét đứt, ánh sáng đều và nền khác màu da.
6. Dùng ngón trỏ, cụp các ngón còn lại. Làm theo hướng dẫn; khi nghe tiếng tít, giữ sát target và xoa nhẹ 3–4 giây.

Camera chỉ hoạt động trong secure context: `localhost` khi phát triển hoặc website deploy bằng HTTPS. Nếu vùng sáng bị nhận sai, chỉnh thanh **Độ nhạy vùng sáng**.

## Kiểm tra trước khi deploy

```bash
npm run lint
npm run test:vision
npm run build
npm run preview
```

Model MediaPipe và WebAssembly đã nằm trong `public/models` và `public/mediapipe`, nên không cần tải model từ CDN khi đang sử dụng.

## Giới hạn MVP

- Auth và dữ liệu đang lưu trong `localStorage`; chưa phù hợp môi trường production hoặc dữ liệu y tế thật.
- Phát hiện vùng da sáng là heuristic màu, có thể nhầm ánh sáng phản chiếu, sẹo hoặc tình trạng da khác.
- Trước khi triển khai thực tế cần backend có mã hóa, phân quyền, đồng ý xử lý dữ liệu, đánh giá lâm sàng và kiểm thử trên nhiều màu da/điều kiện sáng.
