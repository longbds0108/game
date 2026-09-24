# Crab Race — prototype giao diện

Prototype Crab Race theo đặc tả `Crab-Race-MVP-Spec.md`, có server realtime local.

## Chạy thử

Chạy `node server.js`, sau đó mở `http://localhost:4173` trên các thiết bị cùng mạng.

## Có sẵn trong prototype

- Trang đầu: tạo phòng, vào phòng bằng mã, link phòng dạng `#room/{code}`.
- Lobby: chọn cua, bật sẵn sàng, mã phòng và nút sao chép link.
- Đua: đếm ngược 3–2–1, sáu làn, BOT lấp làn trống, sự kiện tăng tốc/dừng/lùi.
- Kết quả: thứ hạng, người sở hữu cua, số lần thắng trong phòng và đua lại.
- Server giữ state phòng và phát snapshot qua Server-Sent Events; các lệnh được kiểm tra ở server.
- Responsive cho điện thoại, có hỗ trợ `prefers-reduced-motion`.

Để test hai thiết bị trong cùng Wi‑Fi, máy chạy server cần cho phép cổng `4173` qua firewall và thiết bị còn lại truy cập bằng địa chỉ IP LAN của máy đó, ví dụ `http://192.168.1.20:4173`. Dữ liệu hiện lưu trong RAM nên sẽ mất khi restart server.
