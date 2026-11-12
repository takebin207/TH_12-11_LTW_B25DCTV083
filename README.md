# Sổ chi tiêu — React Class & Hooks

Bài tập quản lý chi tiêu bằng React + Vite, giao diện tiếng Việt, responsive, sáng/tối. Chuyển phiên bản bằng hai nút trên header. Phần B đã nối sẵn MockAPI.io, không cần cấu hình thêm.

## Chạy dự án

Yêu cầu Node.js 22.22.2+ trong nhánh 22, hoặc 24.15+ trong nhánh 24. GitHub Actions dùng Node 22 mới nhất.

```sh
npm install
npm run dev
```

Trên PowerShell chặn `npm.ps1`, dùng `npm.cmd install`, `npm.cmd run dev`.

```sh
npm test
npm run build
npm run preview
```

## MockAPI.io mặc định

Endpoint: https://6af522cdf6270fa08d67c265.mockapi.io/expenses

Resource đã tạo với `content: String`, `amount: Number`, `category: String`, `date: String` và `id` tự sinh; có 5 khoản chi mẫu. GET/POST/DELETE đã được kiểm tra trên dịch vụ thật. Chỉ cần `npm run dev` và chọn Phần B. Dữ liệu được lưu trên MockAPI.io, cần kết nối Internet.

Request có timeout 10 giây, hủy khi unmount, giữ dữ liệu cũ nếu tải lại thất bại; không tự gửi lại POST/DELETE để tránh thao tác trùng. Nếu mất kết nối sau khi gửi, bấm Thử lại để tải lại danh sách trước khi thao tác tiếp.

Theme và endpoint được lưu trong localStorage. Endpoint ưu tiên: lựa chọn đã lưu → `VITE_MOCKAPI_URL` → endpoint mặc định. Để trống cấu hình rồi bấm Áp dụng sẽ quay về endpoint mặc định. Nếu trình duyệt chặn lưu trữ, ứng dụng vẫn chạy trong phiên hiện tại.

`npm run check:mockapi` kiểm tra dịch vụ thật, tạo rồi xóa **chỉ bản ghi kiểm thử do lệnh này tạo**. Không chạy lệnh này tự động trong CI; CI dùng mock fetch và file tạm, không sửa dữ liệu trực tuyến.

## Tùy chọn: mock API cục bộ

Nhập `/api/expenses` ở phần cấu hình MockAPI để chuyển sang chế độ cục bộ. Vite chạy API cùng giao diện bằng `npm run dev` hoặc `npm run preview`, không cần hai terminal.

| Endpoint | Chức năng |
| --- | --- |
| `GET /api/expenses` | Lấy danh sách |
| `POST /api/expenses` | Thêm khoản chi, trả bản ghi có ID do server tạo (HTTP 201) |
| `DELETE /api/expenses/:id` | Xóa khoản chi, trả HTTP 404 nếu ID không tồn tại |

- Validate phía server: JSON/dữ liệu sai trả 400, body quá lớn trả 413, sai Content-Type trả 415, sai method trả 405, lỗi lưu trữ trả 500.
- File `server/data/expenses.json` tự tạo với dữ liệu mẫu lần đầu và được bỏ qua trong Git. Khoản chi vẫn còn khi tải lại trang, chuyển tab A/B và khởi động lại server. Danh sách rỗng sau khi xóa hết không bị tự thêm mẫu trở lại.
- Thao tác lưu được tuần tự hóa và thay file bằng rename để tránh ghi chồng hoặc file ghi dở. Nếu file hỏng, server báo lỗi và giữ file để kiểm tra, không ghi đè bằng dữ liệu mẫu.
- Có thể chạy riêng API bằng `npm run api`, mặc định tại `http://127.0.0.1:3001/api/expenses`. Giao diện thông thường dùng API cùng nguồn của Vite, không cần lệnh này.
- Đây là mock API tự xây dựng trên máy, **không phải dịch vụ MockAPI.io**. Bản build tĩnh `dist/` cần server API đi kèm; dùng `npm run preview` cho bản chạy đầy đủ cục bộ. API chưa có đăng nhập/phân quyền, chỉ dùng phục vụ bài tập cục bộ.

## Phần A: Class Component

- `src/ClassApp.jsx`: `ClassApp` giữ danh sách mẫu, loại lọc, tìm kiếm và trạng thái hiển thị đồng hồ. `ClassExpenseForm` giữ form và lỗi validate.
- `ClassClock`: tạo interval trong `componentDidMount`, xóa bằng `clearInterval` trong `componentWillUnmount`. Nút Ẩn đồng hồ **unmount** component, không chỉ ẩn bằng CSS.
- `componentDidUpdate` cập nhật tiêu đề tab khi danh sách thay đổi; đồng thời quản lý timer debounce. Hủy timer tìm kiếm khi unmount.
- Danh sách dùng `key={expense.id}`, xóa cần `window.confirm`. Validate nội dung, số tiền nguyên dương, loại và ngày hợp lệ.
- Dữ liệu trong bộ nhớ; tải lại trang hoặc chuyển phiên bản sẽ khởi tạo lại dữ liệu mẫu.

## Phần B: Function Component + Hooks

- `src/HooksApp.jsx`: phiên bản function, quản lý state bằng `useState`.
- `src/hooks/useFetch.js`: GET khi mount, POST để thêm và DELETE theo ID. Có `loading`, `pending`, `error`, thử lại, kiểm tra HTTP/định dạng dữ liệu, chỉ đổi danh sách sau khi API thành công. Hủy request bằng `AbortController` khi unmount hoặc đổi nguồn. Chặn thao tác gửi trùng khi đang xử lý.
- `useRef` giữ tham chiếu input và focus lại sau khi thêm thành công; lỗi API giữ nguyên form để thử lại.
- `ThemeContext` và `useContext` cung cấp chế độ sáng/tối. Theme được dùng chung cho cả hai phiên bản.
- `useClock` gói interval + cleanup; `useDebounce` trì hoãn tìm kiếm 350 ms và dọn timeout.
- Hai phiên bản dùng chung component trình bày trong `components/UI.jsx` và các hàm tính toán, validate trong `data.js`. Logic state/lifecycle ở Phần A dùng Class, ở Phần B dùng Function + Hooks.

### Tùy chọn: kết nối dịch vụ MockAPI.io

Phần B đã nối sẵn resource ở trên. Các bước sau dành cho việc thay bằng project MockAPI.io khác:

1. Tạo project tại https://mockapi.io và resource tên `expenses`.
2. Giữ trường `id` tự tạo của MockAPI, thêm schema:

| Trường | Kiểu | Ví dụ |
| --- | --- | --- |
| content | String | Cà phê buổi sáng |
| amount | Number | 35000 |
| category | String | Ăn uống |
| date | String | 2026-11-12 |

`category` phải thuộc `Ăn uống`, `Đi lại`, `Học tập`, `Giải trí`. `date` dùng `YYYY-MM-DD`. Xóa hoặc sửa dữ liệu Faker tự sinh nếu không đúng schema này; một resource trống cũng hợp lệ.

3. Bấm **MockAPI** trên header, nhập URL resource (ví dụ `https://PROJECT.mockapi.io/api/v1/expenses`) và bấm **Áp dụng**. Hoặc sao chép `.env.example` thành `.env`, thay `VITE_MOCKAPI_URL` bằng URL thật rồi khởi động lại Vite.
4. Chọn Phần B. Mở Network trong DevTools để kiểm tra GET, POST, DELETE. Kiểm tra tải lại trang vẫn lấy được dữ liệu đã lưu. Endpoint nhập trên giao diện được lưu trên trình duyệt; dùng `.env` để thay mặc định của bản build.

GET/POST dùng URL resource; DELETE dùng `URL/:id`. Không đặt API key hoặc bí mật vào biến `VITE_*` vì các biến này được đưa vào mã phía trình duyệt. Để chuyển sang API cục bộ, nhập `/api/expenses` trong cấu hình.

## Hooks giải quyết thách thức của Class ở đâu?

| Thách thức trong Class | Cách Hooks xử lý trong bài |
| --- | --- |
| Logic đồng hồ tách giữa mount và unmount | `useClock` đặt việc tạo và dọn interval cạnh nhau trong một effect, dễ tái sử dụng. |
| Cập nhật title cần so sánh state trước/sau | `useEffect([total])` khai báo trực tiếp phụ thuộc tổng chi. |
| Debounce phải tự quản lý timer qua lifecycle | `useDebounce` đóng gói state, timeout và cleanup. |
| Fetch và trạng thái mạng dễ trộn với giao diện | `useFetch` tách GET/POST/DELETE, loading, lỗi và hủy request khỏi component. |
| Cần bind phương thức hoặc dùng arrow method cho `this` | Function dùng closure và setter, không cần `this`. |
| Truyền theme qua nhiều lớp props | `useContext` đọc theme chung ngay tại nút chuyển chế độ. |
| Focus DOM sau cập nhật giao diện | `useRef` giữ input; effect focus sau khi thao tác thêm đã hoàn tất và input được mở lại. |

## Quy ước hiển thị

- Thống kê đầu trang và tiêu đề tab: **toàn bộ danh sách**, không phụ thuộc bộ lọc.
- Dòng tổng cuối danh sách: **các khoản đang hiển thị** sau khi lọc loại và tìm nội dung.
- Thống kê bốn loại hiển thị tổng tiền, số khoản và tỷ trọng.
- Tìm kiếm không phân biệt chữ hoa/thường, giữ nguyên dấu tiếng Việt; trễ 350 ms ở cả hai phiên bản.
- Dữ liệu mẫu dùng ngày hiện tại theo thiết bị. Ngày chi được giữ dạng ngày lịch, tránh lệch múi giờ khi hiển thị.
- Phần A dùng state trong bộ nhớ, Phần B dùng MockAPI.io mặc định (hoặc API cục bộ nếu chọn). Chuyển tab khởi tạo lại state giao diện; Phần B tải lại khoản chi đã lưu từ API.

## Kiểm tra thủ công

1. Thử cả A/B: thêm hợp lệ, nội dung rỗng, số âm/0/số lẻ, xóa và hủy xác nhận.
2. Lọc từng loại; nhập tìm kiếm; đối chiếu tổng hiển thị với thống kê toàn bộ và tiêu đề tab.
3. Ẩn/hiện đồng hồ; đổi giao diện; kiểm tra màn hình điện thoại.
4. Với MockAPI: tạo/xóa rồi tải lại trang; thử endpoint lỗi để thấy thông báo và nút Thử lại. Kiểm tra input nhận focus sau khi thêm thành công.

## Kiểm thử tự động

`npm test` chạy kiểm thử tính toán/validate và HTTP integration trên file tạm: GET/POST/DELETE, lưu qua lần khởi tạo server mới, dữ liệu sai, mã lỗi HTTP, nhiều request thêm đồng thời, khởi tạo dữ liệu mẫu một lần và bảo toàn file hỏng. Test không sửa dữ liệu đang dùng của ứng dụng.

Vitest + React Testing Library kiểm tra focus/reset form và title sau thêm, debounce 350 ms, dọn interval/timeout, hủy request khi unmount, timeout mạng, giữ dữ liệu khi refresh lỗi, lưu theme và xác nhận xóa ở bản Class. `.github/workflows/check.yml` tự chạy `npm ci`, `npm test`, `npm run build` khi push hoặc pull request.
