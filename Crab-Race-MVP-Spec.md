# Crab Race — đặc tả MVP để AI lập trình

## Mục tiêu
Làm một game trình duyệt chơi cùng bạn bè qua mã hoặc link phòng. Không đăng nhập, không ví, không đặt cược. Người chơi nhập biệt danh, chọn một trong sáu cua rồi cùng xem cuộc đua tự động khoảng 20–30 giây. Giao diện tiếng Việt, vui nhộn, dùng tốt trên điện thoại và máy tính.

## Luồng chơi
1. Trang đầu có **Tạo phòng** và **Vào phòng** bằng mã. Người vào qua link được điền sẵn mã.
2. Nhập biệt danh 2–20 ký tự. Host tạo phòng nhận link và mã mời dễ sao chép.
3. Lobby hiển thị sáu cua với màu và tên riêng: Rocket đỏ, Bubbles xanh dương, Lucky xanh lá, Goldie vàng, Sleepy tím, Chaos cam. Người chơi chọn cua còn trống và bấm **Sẵn sàng**. Tối đa sáu người; mỗi người một cua. Không cho hai người chọn cùng một cua.
4. Host bấm **Bắt đầu** khi có ít nhất một người trong phòng và tất cả người tham gia đang online đều sẵn sàng. Các cua chưa được chọn do bot điều khiển. Đếm ngược 3–2–1 đồng bộ cho cả phòng.
5. Sáu cua chạy trên sáu làn từ trái sang phải. Các sự kiện ngắn: tăng tốc, dừng, chạy lùi; hiển thị bằng nhãn/hiệu ứng dễ hiểu. Người chơi không điều khiển trong lúc đua.
6. Kết thúc hiển thị cua vô địch, biệt danh người chơi hoặc “BOT”, thứ tự về đích, kết quả chọn cua và bảng thắng trong phòng. Host bấm **Đua lại** để trở về lobby cùng phòng; mọi người có thể đổi cua và bấm sẵn sàng lại.

## Quy tắc phòng và đồng bộ
- Sinh mã phòng ngẫu nhiên khó đoán; link dạng `/room/{code}`. Mã không phân biệt hoa thường. Không yêu cầu tài khoản.
- Mỗi người được cấp một mã phiên ngẫu nhiên, lưu trên trình duyệt để tải lại trang có thể vào lại đúng chỗ. Biệt danh chỉ là tên hiển thị, không phải danh tính bảo mật.
- Server là nguồn dữ liệu chung cho lobby, trạng thái sẵn sàng, cuộc đua và kết quả. Dùng kết nối thời gian thực để tất cả thấy cùng một cuộc đua. Không tạo kết quả random độc lập trên từng trình duyệt.
- Chỉ host khởi động hoặc đặt lại cuộc đua. Nếu host rời phòng, chuyển quyền cho người online đã vào sớm nhất. Người mất kết nối trong lúc đua có thể trở lại xem trạng thái hiện tại.
- Khoá việc chọn cua và sẵn sàng khi đếm ngược hoặc đang đua. Người vào lúc cuộc đua đã bắt đầu được xem như khán giả và tham gia lượt kế tiếp nếu còn chỗ.
- Mỗi phòng tối đa sáu người chơi, có thể có thêm khán giả. Khi bắt đầu, thêm bot vào những làn trống. Bot không được tính vào bảng thắng của người chơi.
- Phòng tự hết hạn sau 60 phút không có người online. Thống kê số trận và số lần thắng chỉ lưu trong phòng còn tồn tại.
- Chống thao tác lặp: nhấn Bắt đầu/Đua lại nhiều lần không tạo nhiều cuộc đua; từ chối lệnh từ người không phải host; kiểm tra mã phiên ở server.

## Mô phỏng cuộc đua
- Server tạo một `raceId`, thời điểm bắt đầu, seed ngẫu nhiên, danh sách cua và lịch diễn biến. Phát cùng dữ liệu cho mọi client; client chỉ nội suy hoạt ảnh theo đồng hồ server và nhận kết quả server xác nhận.
- Mỗi cua có cơ hội thắng cân bằng; tên và tính cách chỉ là hình ảnh ở MVP. Tốc độ thay đổi nhiều lần trong trận. Các sự kiện tạo bất ngờ nhưng không làm cua nhảy thẳng tới đích.
- Mỗi trận nên kết thúc trong 20–30 giây; đảm bảo luôn có đúng một cua thắng. Nếu hai cua tới đích cùng lúc, server dùng thời gian chính xác hơn rồi thứ tự làn để phá hoà. Lưu thứ hạng của cả sáu cua.
- Khi người chơi ngắt kết nối, cuộc đua vẫn tiếp tục. Không có điểm quy đổi, tiền, token hoặc phần thưởng có giá trị thật.

## Giao diện
- **Trang đầu:** tên game, Tạo phòng, ô mã phòng + Vào phòng.
- **Lobby:** mã/link + Sao chép, danh sách người chơi, sáu thẻ cua, trạng thái sẵn sàng, nút bắt đầu chỉ host thấy, gợi ý chờ người khác.
- **Đường đua:** sáu làn, tên cua và chủ sở hữu, vạch xuất phát/đích, đếm ngược, hiệu ứng sự kiện, tiến độ rõ trên màn hình nhỏ.
- **Kết quả:** cua thắng, thứ hạng, người chọn đúng, thống kê thắng của phòng, nút Đua lại cho host; người khác thấy thông báo chờ host.
- Có trạng thái tải, mất kết nối/đang kết nối lại, phòng không tồn tại hoặc hết hạn, phòng đầy, mã không đúng. Hỗ trợ giảm chuyển động theo tùy chọn hệ điều hành.

## Gợi ý triển khai
- Chọn stack web và backend thời gian thực phù hợp môi trường triển khai. Cần một server hoặc dịch vụ realtime có khả năng quản lý phòng; chỉ dùng localStorage không thể chơi nhiều thiết bị.
- Tách logic trạng thái phòng (`lobby → countdown → racing → results → lobby`) khỏi giao diện. Lưu trên server `roomCode`, `hostSessionId`, `players`, `selectedCrab`, `ready`, `phase`, `raceId`, `timeline`, `finishOrder`, `roomWins`.
- Sự kiện tối thiểu: `create_room`, `join_room`, `select_crab`, `set_ready`, `start_race`, `race_started`, `race_update`, `race_finished`, `reset_room`, `room_snapshot`, `error`.
- Kiểm tra nickname và mã phòng ở server; tránh chèn HTML qua tên người chơi. Giới hạn tần suất tạo/vào phòng cơ bản.

## Tiêu chí hoàn thành
- Mở hai trình duyệt hoặc hai thiết bị, tạo phòng và vào bằng link; thấy người chơi và lựa chọn cua cập nhật tức thì.
- Không thể chọn cua đã có chủ; hai người tranh cùng cua thì chỉ một người được nhận.
- Người không phải host không thể bắt đầu hoặc đặt lại; chưa đủ sẵn sàng không thể bắt đầu.
- Hai thiết bị thấy cùng đếm ngược, diễn biến và kết quả; tải lại giữa trận vẫn hiện đúng trạng thái.
- Cua BOT lấp làn trống; hết trận có thứ hạng và chỉ ghi thắng cho người chơi chọn cua vô địch.
- Đua lại giữ phòng và thống kê, xoá trạng thái sẵn sàng để bắt đầu lượt mới.
- Hoạt động trên màn hình điện thoại; lỗi kết nối hoặc mã phòng được thông báo rõ.

## Prompt đưa cho AI code
Hãy xây dựng một ứng dụng web hoàn chỉnh dựa đúng trên đặc tả Crab Race trong file này. Ưu tiên MVP chơi được giữa nhiều thiết bị thực sự: tạo/vào phòng không cần đăng nhập, lobby realtime, chọn cua không trùng, quyền host, bot lấp làn, cuộc đua 20–30 giây do server quyết định, cùng kết quả cho mọi người, đua lại và bảng thắng trong phòng. Giao diện tiếng Việt, responsive, phong cách bãi biển vui nhộn. Viết hướng dẫn chạy local, các biến môi trường cần thiết và cách triển khai backend realtime. Không thêm wallet, token, đặt cược, shop hay tài khoản. Trước khi bàn giao, tự chạy và kiểm tra luồng với hai client, kể cả tải lại trang giữa trận.
