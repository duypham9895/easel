# iOS Health Sync + Period Prediction Onboarding — Copy Document

**Feature:** iOS HealthKit Sync Enhancement + Guided Period Prediction Onboarding
**Version:** 1.6.0
**i18n Namespace:** `health`
**Languages:** English (EN), Vietnamese (VI)
**Tone:** Empathetic, empowering, non-clinical, privacy-forward

---

## 1. iOS HealthKit Permission (Pre-Permission Education Screen)

| i18n Key | EN | VI |
|----------|----|----|
| `health.education.headline` | Smarter predictions from day one | Dự đoán thông minh hơn ngay từ ngày đầu |
| `health.education.body` | Easel can read your cycle history from Apple Health to give you more accurate predictions right away. Nothing is shared, and you're always in control. | Easel có thể đọc lịch sử chu kỳ từ Apple Health để đưa ra dự đoán chính xác hơn ngay lập tức. Dữ liệu không được chia sẻ, và bạn luôn nắm quyền kiểm soát. |
| `health.education.bullet1` | **What we read:** Only your period dates — nothing else | **Chúng tôi đọc gì:** Chỉ ngày kinh nguyệt — không gì khác |
| `health.education.bullet2` | **Why it helps:** More history means better predictions for you and your Sun | **Vì sao hữu ích:** Càng nhiều dữ liệu, dự đoán càng chính xác cho bạn và Sun của bạn |
| `health.education.bullet3` | **Your privacy:** Data stays on your device. We never write to or share your health data. | **Quyền riêng tư:** Dữ liệu ở trên thiết bị của bạn. Chúng tôi không bao giờ ghi hoặc chia sẻ dữ liệu sức khoẻ. |
| `health.education.primaryButton` | Continue with Apple Health | Tiếp tục với Apple Health |
| `health.education.secondaryButton` | Enter manually instead | Nhập thủ công |
| `health.education.privacyBadge` | Read-only · Never shared · Change anytime in Settings | Chỉ đọc · Không chia sẻ · Đổi bất cứ lúc nào trong Cài đặt |

---

## 2. Syncing State

| i18n Key | EN | VI |
|----------|----|----|
| `health.sync.loading` | Reading your cycle history... | Đang đọc lịch sử chu kỳ... |
| `health.sync.subtext` | This usually takes just a few seconds | Thường chỉ mất vài giây |

---

## 3. Import Summary (Data Found)

| i18n Key | EN | VI |
|----------|----|----|
| `health.import.headline` | Here's what we found | Đây là những gì chúng tôi tìm thấy |
| `health.import.periodsFound` | Periods found | Số kỳ kinh tìm thấy |
| `health.import.dateRange` | Date range | Khoảng thời gian |
| `health.import.averageCycle` | Average cycle | Chu kỳ trung bình |
| `health.import.averageCycleDays` | {{count}} days | {{count}} ngày |
| `health.import.dateRangeValue` | {{start}} – {{end}} | {{start}} – {{end}} |
| `health.import.primaryButton` | Looks good, continue | Đúng rồi, tiếp tục |
| `health.import.secondaryLink` | This doesn't look right | Thông tin này không đúng |

---

## 4. Import Summary (No Data / Empty State)

| i18n Key | EN | VI |
|----------|----|----|
| `health.import.emptyHeadline` | No cycle data found | Không tìm thấy dữ liệu chu kỳ |
| `health.import.emptyBody` | It looks like Apple Health doesn't have any period data yet. No worries — you can enter your details and we'll start tracking from here. | Apple Health chưa có dữ liệu kỳ kinh nào. Không sao — bạn có thể nhập thông tin và chúng tôi sẽ bắt đầu theo dõi từ đây. |
| `health.import.emptyCta` | Enter my cycle info | Nhập thông tin chu kỳ |

---

## 5. Manual Input Form

| i18n Key | EN | VI |
|----------|----|----|
| `health.manual.headline` | Tell us about your cycle | Cho chúng tôi biết về chu kỳ của bạn |
| `health.manual.lastPeriodLabel` | When did your last period start? | Kỳ kinh gần nhất bắt đầu khi nào? |
| `health.manual.lastPeriodPlaceholder` | Select a date | Chọn ngày |
| `health.manual.lastPeriodHelper` | Pick the first day of your most recent period | Chọn ngày đầu tiên của kỳ kinh gần nhất |
| `health.manual.cycleLengthLabel` | Cycle length | Độ dài chu kỳ |
| `health.manual.cycleLengthPlaceholder` | 28 days | 28 ngày |
| `health.manual.cycleLengthHelper` | Usually between 21 and 45 days | Thường từ 21 đến 45 ngày |
| `health.manual.cycleLengthDescription` | The number of days from the first day of one period to the first day of the next | Số ngày từ ngày đầu kỳ kinh này đến ngày đầu kỳ kinh tiếp theo |
| `health.manual.periodLengthLabel` | Period length | Độ dài kỳ kinh |
| `health.manual.periodLengthPlaceholder` | 5 days | 5 ngày |
| `health.manual.periodLengthHelper` | Usually between 2 and 10 days | Thường từ 2 đến 10 ngày |
| `health.manual.periodLengthDescription` | How many days your period usually lasts from start to finish | Số ngày kỳ kinh thường kéo dài từ đầu đến cuối |
| `health.manual.notSureToggle` | I'm not sure about my cycle length | Tôi không chắc về độ dài chu kỳ |
| `health.manual.notSureExplanation` | That's completely okay. We'll use typical averages (28-day cycle, 5-day period) and refine as you log more data. | Hoàn toàn không sao. Chúng tôi sẽ dùng mức trung bình phổ biến (chu kỳ 28 ngày, kỳ kinh 5 ngày) và điều chỉnh khi bạn ghi nhận thêm. |
| `health.manual.predictionPreview` | Your next period is predicted around **{{date}}** | Kỳ kinh tiếp theo dự đoán vào khoảng **{{date}}** |

---

## 6. Data Review & Confirmation

| i18n Key | EN | VI |
|----------|----|----|
| `health.review.headline` | Review your cycle summary | Xem lại tổng quan chu kỳ |
| `health.review.sourceHealth` | From Apple Health | Từ Apple Health |
| `health.review.sourceManual` | Entered manually | Nhập thủ công |
| `health.review.predictionText` | Next period expected around **{{date}}** | Kỳ kinh tiếp theo dự kiến vào khoảng **{{date}}** |
| `health.review.confidenceHigh` | High confidence | Độ tin cậy cao |
| `health.review.confidenceHighSub` | Based on {{count}}+ cycles of history — predictions should be very close | Dựa trên {{count}}+ chu kỳ — dự đoán sẽ rất chính xác |
| `health.review.confidenceMedium` | Medium confidence | Độ tin cậy trung bình |
| `health.review.confidenceMediumSub` | Based on a few cycles — predictions will improve as you log more | Dựa trên vài chu kỳ — dự đoán sẽ chính xác hơn khi bạn ghi nhận thêm |
| `health.review.confidenceLow` | Low confidence | Độ tin cậy thấp |
| `health.review.confidenceLowSub` | Based on limited data — log your next period to improve accuracy | Dựa trên ít dữ liệu — ghi nhận kỳ kinh tiếp theo để cải thiện độ chính xác |
| `health.review.editButton` | Edit | Chỉnh sửa |
| `health.review.primaryCta` | Looks good, let's go | Đúng rồi, bắt đầu thôi |
| `health.review.predictionExplanation` | Your prediction is based on {{count}} cycles of data with an average cycle length of {{days}} days. The more periods you log, the more accurate your predictions become. | Dự đoán dựa trên {{count}} chu kỳ với độ dài trung bình {{days}} ngày. Bạn ghi nhận càng nhiều kỳ kinh, dự đoán càng chính xác. |

---

## 7. Error Messages

| i18n Key | EN | VI |
|----------|----|----|
| `health.error.permissionDeniedHeadline` | Apple Health access wasn't granted | Chưa cấp quyền truy cập Apple Health |
| `health.error.permissionDeniedBody` | You can enable it anytime in your iPhone Settings, or just enter your cycle info manually — it works just as well. | Bạn có thể bật lại bất cứ lúc nào trong Cài đặt iPhone, hoặc nhập thông tin chu kỳ thủ công — hiệu quả như nhau. |
| `health.error.permissionDeniedCta` | Enter manually | Nhập thủ công |
| `health.error.syncFailedHeadline` | Something went wrong | Đã xảy ra lỗi |
| `health.error.syncFailedBody` | We couldn't read your health data this time. You can try again or enter your info manually. | Chúng tôi không thể đọc dữ liệu sức khoẻ lần này. Bạn có thể thử lại hoặc nhập thủ công. |
| `health.error.syncFailedRetry` | Try again | Thử lại |
| `health.error.syncFailedAltCta` | Enter manually instead | Nhập thủ công |
| `health.error.futureDate` | That date is in the future — pick the day your last period started | Ngày đó nằm trong tương lai — chọn ngày kỳ kinh gần nhất bắt đầu |
| `health.error.tooFarPast` | That's more than 90 days ago — choose a more recent date | Đó là hơn 90 ngày trước — chọn ngày gần hơn |
| `health.error.invalidCycleLength` | Cycle length should be between 21 and 45 days | Độ dài chu kỳ nên từ 21 đến 45 ngày |
| `health.error.invalidPeriodLength` | Period length should be between 2 and 10 days | Độ dài kỳ kinh nên từ 2 đến 10 ngày |

---

## 8. Success / Confirmation

| i18n Key | EN | VI |
|----------|----|----|
| `health.success.syncComplete` | Health data synced successfully | Đồng bộ dữ liệu sức khoẻ thành công |
| `health.success.manualSaved` | Cycle info saved — your predictions are ready | Đã lưu thông tin chu kỳ — dự đoán đã sẵn sàng |
| `health.success.resyncComplete` | Health data updated — predictions refreshed | Đã cập nhật dữ liệu sức khoẻ — dự đoán đã làm mới |

---

## 9. Settings Screen

| i18n Key | EN | VI |
|----------|----|----|
| `health.settings.sectionHeader` | Health Data | Dữ liệu sức khoẻ |
| `health.settings.lastSynced` | Last synced: {{timestamp}} | Đồng bộ lần cuối: {{timestamp}} |
| `health.settings.resyncButton` | Re-sync from Apple Health | Đồng bộ lại từ Apple Health |
| `health.settings.updateCycleButton` | Update cycle info | Cập nhật thông tin chu kỳ |
| `health.settings.statusConnected` | Connected to Apple Health | Đã kết nối với Apple Health |
| `health.settings.statusNotConnected` | Not connected | Chưa kết nối |

---

## 10. Tooltips & Info Icons

| i18n Key | EN | VI |
|----------|----|----|
| `health.tooltip.cycleLength` | Your cycle length is the number of days from the first day of one period to the first day of the next. Most cycles are between 21 and 35 days. Don't worry if yours varies — that's normal. | Độ dài chu kỳ là số ngày từ ngày đầu kỳ kinh này đến ngày đầu kỳ kinh tiếp theo. Hầu hết chu kỳ từ 21 đến 35 ngày. Đừng lo nếu chu kỳ của bạn thay đổi — điều đó bình thường. |
| `health.tooltip.periodLength` | Your period length is how many days your period lasts, from the first day of flow to the last. Most periods last 3 to 7 days. | Độ dài kỳ kinh là số ngày kỳ kinh kéo dài, từ ngày đầu tiên đến ngày cuối cùng. Hầu hết kỳ kinh kéo dài từ 3 đến 7 ngày. |
| `health.tooltip.prediction` | We use your past cycle data to estimate when your next period will start. The more cycles we know about, the better the prediction. After a few cycles, predictions typically land within 1–2 days. | Chúng tôi dùng dữ liệu chu kỳ trước đây để ước tính khi nào kỳ kinh tiếp theo sẽ bắt đầu. Càng nhiều chu kỳ, dự đoán càng chính xác. Sau vài chu kỳ, dự đoán thường chính xác trong 1–2 ngày. |
| `health.tooltip.confidence` | Confidence reflects how much data is behind your prediction. High means 6+ cycles of history. Medium means 2–5 cycles. Low means we're working with limited info — your predictions will improve as you log more periods. | Độ tin cậy phản ánh lượng dữ liệu đằng sau dự đoán. Cao nghĩa là 6+ chu kỳ. Trung bình nghĩa là 2–5 chu kỳ. Thấp nghĩa là dữ liệu còn ít — dự đoán sẽ cải thiện khi bạn ghi nhận thêm kỳ kinh. |
| `health.tooltip.privacy` | Easel only reads your period dates from Apple Health — nothing else. Your data stays on your device and is never shared with third parties. You can revoke access anytime in your iPhone Settings. | Easel chỉ đọc ngày kỳ kinh từ Apple Health — không gì khác. Dữ liệu ở trên thiết bị và không bao giờ được chia sẻ với bên thứ ba. Bạn có thể thu hồi quyền truy cập bất cứ lúc nào trong Cài đặt iPhone. |
