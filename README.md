# Crab Race — prototype giao diện

Prototype Crab Race theo đặc tả `Crab-Race-MVP-Spec.md`, có server realtime local và cấu trúc API tương thích Vercel.

## Chạy thử

Chạy `node server.js`, sau đó mở `http://localhost:4173` trên các thiết bị cùng mạng.

## Có sẵn trong prototype

- Trang đầu: tạo phòng, vào phòng bằng mã, link phòng dạng `#room/{code}`.
- Host có thể chọn quy mô phòng `6 / 8 / 16 / 32 / 64 / 100`; số cua bằng đúng quy mô phòng, người chưa chọn cua sẽ được BOT điều khiển.
- Lobby: chọn cua, bật sẵn sàng, mã phòng và nút sao chép link.
- Đua: đếm ngược 3–2–1, sáu làn, BOT lấp làn trống, sự kiện tăng tốc/dừng/lùi.
- Kết quả: thứ hạng, người sở hữu cua, số lần thắng trong phòng và đua lại.
- Server giữ state phòng và phát snapshot qua Server-Sent Events; các lệnh được kiểm tra ở server.
- Responsive cho điện thoại, có hỗ trợ `prefers-reduced-motion`.
- Bộ chọn ngôn ngữ Việt / English, lưu lựa chọn trên trình duyệt.
- Dùng asset `crab.png` làm hình chú cua trong lobby, đường đua và kết quả.
- Dùng asset `deapp-logo.png` làm logo và biểu trưng deapp trên toàn bộ giao diện.
- Khi chạy trên HTTPS/Vercel, client tự chuyển sang polling API 1 giây/lần vì Vercel không giữ kết nối SSE lâu như server local.

Để test hai thiết bị trong cùng Wi‑Fi, máy chạy server cần cho phép cổng `4173` qua firewall và thiết bị còn lại truy cập bằng địa chỉ IP LAN của máy đó, ví dụ `http://192.168.1.20:4173`. Dữ liệu hiện lưu trong RAM nên sẽ mất khi restart server.

## Deploy lên Vercel

Import repository này vào Vercel và dùng cấu hình mặc định: không cần build command, không cần output directory. Vercel sẽ phục vụ các file giao diện ở root và route API qua `api/[...path].js`.

Lưu ý: state phòng hiện vẫn lưu trong RAM của serverless function. Bản deploy phù hợp để demo/test; nếu cần nhiều phòng và realtime ổn định production, cần nối thêm một database hoặc Redis dùng chung.
