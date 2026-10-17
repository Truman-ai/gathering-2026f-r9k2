// Shared script for every meeting page. Each /<yymmdd>/index.html loads this file;
// the meeting's own content comes from event.json in that same folder.
document.body.insertAdjacentHTML("afterbegin", `
<div class="wrap">
  <header>
    <div class="place" id="place">Pakkret, Thailand</div>
    <h1 id="title">2026 Weekend Fellowship in Pakkret</h1>
    <p class="dates" id="dates">Oct 16 – 18, 2026</p>
    <p class="theme" id="theme"><b>The Final Preparation for the Coming of the King</b>
      <span>Knowing and Cooperating with Christ as the Great High Priest in Perfecting Our Salvation</span></p>
  </header>

  <div class="zonebar">
    <label class="hint" for="langSelect" data-t="language">Language</label>
    <select class="zone-select lang" id="langSelect"></select>
    <label class="hint" for="zoneSelect" data-t="where">Where are you now?</label>
    <select class="zone-select" id="zoneSelect"></select>
    <div class="picker" id="picker" hidden>
      <button class="device" id="useDevice" type="button"></button>
      <label class="lbl" for="tzSearch" data-t="search">Or search for your city</label>
      <input id="tzSearch" type="search" placeholder="e.g. Sydney, London, Dubai" autocomplete="off" enterkeyhint="search">
      <ul class="results" id="tzResults"></ul>
    </div>
    <div class="now" id="now"></div>
  </div>

  <section class="next" id="next" aria-live="polite"></section>

  <section class="overview" id="overview" aria-label="Overview"></section>

  <section>
    <h2 data-t="schedule">Schedule</h2>
    <p class="sub" id="schedSub"></p>
    <div id="schedule"></div>
  </section>

  <section class="zoom">
    <h2 data-t="zoom">Zoom meeting</h2>
    <div class="cred">
      <div><div class="lbl" data-t="meetingId">Meeting ID</div><div class="val" id="zid"></div></div>
      <button class="copy" type="button" data-target="zid" data-t="copy" hidden>Copy</button>
    </div>
    <div class="cred">
      <div><div class="lbl" data-t="passcode">Passcode</div><div class="val" id="zpw"></div></div>
      <button class="copy" type="button" data-target="zpw" data-t="copy" hidden>Copy</button>
    </div>
    <a class="join" id="zjoin" target="_blank" rel="noopener" data-t="join" hidden>Open in Zoom</a>
  </section>

  <button class="share" id="share" type="button">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>
    <span data-t="share">Share with fellow priests</span>
  </button>

  <footer id="footer">Meeting times are set in Thailand time (ICT). Times in other zones are converted automatically.</footer>
</div>
`);

// Thailand first, then nearest to Pakkret (the 2026 venue)
const ZONES = [
  { id: "th", place: "Bangkok",           tz: "Asia/Bangkok",        abbr: "ICT" },
  { id: "mm", place: "Yangon",            tz: "Asia/Yangon",         abbr: "MMT", also: ["Asia/Rangoon"] },
  { id: "vn", place: "Ho Chi Minh",       tz: "Asia/Ho_Chi_Minh",    abbr: "ICT", also: ["Asia/Saigon"] },
  { id: "ph", place: "Manila",            tz: "Asia/Manila",         abbr: "PHT" },
  { id: "kr", place: "Seoul",             tz: "Asia/Seoul",          abbr: "KST" },
  { id: "eu", place: "Stuttgart, Zurich", tz: "Europe/Berlin",       abbr: "CEST", also: ["Europe/Zurich"] },
  { id: "ca", place: "Fountain Valley",   tz: "America/Los_Angeles", abbr: "PDT" },
  { id: "to", place: "Toronto",           tz: "America/Toronto",     abbr: "EDT" },
];

// Everything about the meeting itself (title, venue, dates, sessions, Zoom) lives in the folder's
// event.json, edited through edit.html. This file holds only the page's own wording in each language.

// Ordered like ZONES: English, then the host, then nearest to Pakkret.
// {x} placeholders are filled in by t(). `locale` drives date/time formatting.
const TEXT = {
  en: {
    label: "English", locale: "en-US",
    share: "Share with fellow priests", linkCopied: "Link copied",
    language: "Language", where: "Where are you now?", otherCity: "Other city…",
    useDevice: "Use my phone's time · {city}", search: "Or search for your city",
    placeholder: "e.g. Sydney, London, Dubai", noCity: "No city found. Try a nearby major city.",
    nowIn: "Now in {zone}:", next: "Next", live: "In progress", until: "until {time}", inDays: "in {d}d {h}h", inHours: "in {h}h {m}m", inMins: "in {m} min",
    session: "Session {n}", complete: "Gathering complete", thanks: "Thank you for joining",
    begins: "Begins", final: "Final session", schedule: "Schedule",
    allHost: "All times in {host} time ({hostAbbr}).",
    shownIn: "Times shown in {zone} time ({abbr}). {host} time is listed under each meeting.",
    lateNight: "Late night", zoom: "Zoom meeting", meetingId: "Meeting ID", passcode: "Passcode",
    tbd: "To be decided", copy: "Copy", copied: "Copied", selected: "Selected", join: "Open in Zoom",
    footer: "Meeting times are set in {host} time ({hostAbbr}). Times in other zones are converted automatically.",
    zones: { th: "Thailand", mm: "Myanmar", vn: "Vietnam", ph: "Philippines", kr: "Korea", eu: "Europe", ca: "California", to: "Canada" },
  },
  th: {
    label: "ไทย", locale: "th-TH",
    share: "แบ่งปันให้เพื่อนปุโรหิต", linkCopied: "คัดลอกลิงก์แล้ว",
    language: "ภาษา", where: "ตอนนี้คุณอยู่ที่ไหน?", otherCity: "เมืองอื่น…",
    useDevice: "ใช้เวลาของโทรศัพท์ · {city}", search: "หรือค้นหาเมืองของคุณ",
    placeholder: "เช่น Sydney, London, Dubai", noCity: "ไม่พบเมือง ลองค้นหาเมืองใหญ่ที่อยู่ใกล้เคียง",
    nowIn: "เวลาขณะนี้ที่{zone}:", next: "ถัดไป", live: "กำลังประชุม", until: "ถึง {time}", inDays: "อีก {d} วัน {h} ชม.", inHours: "อีก {h} ชม. {m} นาที", inMins: "อีก {m} นาที",
    session: "ครั้งที่ {n}", complete: "การประชุมเสร็จสิ้นแล้ว", thanks: "ขอบคุณที่ร่วมประชุม",
    begins: "เริ่ม", final: "ครั้งสุดท้าย", schedule: "กำหนดการ",
    allHost: "เวลาทั้งหมดเป็นเวลา{host} ({hostAbbr})",
    shownIn: "แสดงตามเวลา{zone} ({abbr}) และระบุเวลา{host}ไว้ใต้แต่ละรายการ",
    lateNight: "ดึก", zoom: "ประชุม Zoom", meetingId: "Meeting ID", passcode: "รหัสผ่าน",
    tbd: "รอประกาศ", copy: "คัดลอก", copied: "คัดลอกแล้ว", selected: "เลือกแล้ว", join: "เปิดใน Zoom",
    footer: "เวลาประชุมกำหนดตามเวลา{host} ({hostAbbr}) เวลาในเขตอื่นจะแปลงให้อัตโนมัติ",
    zones: { th: "ไทย", mm: "เมียนมา", vn: "เวียดนาม", ph: "ฟิลิปปินส์", kr: "เกาหลี", eu: "ยุโรป", ca: "แคลิฟอร์เนีย", to: "แคนาดา" },
  },
  my: {
    label: "မြန်မာ", locale: "my-MM",
    share: "ယဇ်ပုရောဟိတ်ညီအစ်ကိုများထံ မျှဝေရန်", linkCopied: "လင့်ခ် ကူးယူပြီး",
    language: "ဘာသာစကား", where: "ယခု သင် ဘယ်မှာ ရှိပါသလဲ။", otherCity: "အခြားမြို့…",
    useDevice: "ဖုန်း၏ အချိန်ကို သုံးမည် · {city}", search: "သို့မဟုတ် သင့်မြို့ကို ရှာပါ",
    placeholder: "ဥပမာ Sydney, London, Dubai", noCity: "မြို့ကို မတွေ့ပါ။ အနီးရှိ မြို့ကြီးတစ်ခုကို ရှာကြည့်ပါ။",
    nowIn: "{zone} ယခုအချိန်:", next: "နောက်တစ်ခု", live: "ယခု ကျင်းပနေသည်", until: "{time} အထိ", inDays: "{d} ရက် {h} နာရီ အကြာ", inHours: "{h} နာရီ {m} မိနစ် အကြာ", inMins: "{m} မိနစ် အကြာ",
    session: "အစည်းအဝေး {n}", complete: "အစည်းအဝေး ပြီးဆုံးပါပြီ", thanks: "ပါဝင်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်",
    begins: "စတင်ချိန်", final: "နောက်ဆုံး အစည်းအဝေး", schedule: "အစီအစဉ်",
    allHost: "အချိန်အားလုံးသည် {host} အချိန် ({hostAbbr}) ဖြစ်သည်။",
    shownIn: "{zone} အချိန် ({abbr}) ဖြင့် ပြထားသည်။ အစည်းအဝေးတစ်ခုချင်းအောက်တွင် {host} အချိန်ကို ဖော်ပြထားသည်။",
    lateNight: "ညနက်", zoom: "Zoom အစည်းအဝေး", meetingId: "Meeting ID", passcode: "စကားဝှက်",
    tbd: "နောက်မှ အကြောင်းကြားပါမည်", copy: "ကူးယူ", copied: "ကူးယူပြီး", selected: "ရွေးပြီး", join: "Zoom တွင် ဖွင့်ရန်",
    footer: "အစည်းအဝေးအချိန်များကို {host} အချိန် ({hostAbbr}) ဖြင့် သတ်မှတ်ထားပြီး အခြားဒေသအချိန်များကို အလိုအလျောက် ပြောင်းပေးသည်။",
    zones: { th: "ထိုင်း", mm: "မြန်မာ", vn: "ဗီယက်နမ်", ph: "ဖိလစ်ပိုင်", kr: "ကိုရီးယား", eu: "ဥရောပ", ca: "ကယ်လီဖိုးနီးယား", to: "ကနေဒါ" },
  },
  vi: {
    label: "Tiếng Việt", locale: "vi-VN",
    share: "Chia sẻ với các thầy tế lễ đồng công", linkCopied: "Đã sao chép liên kết",
    language: "Ngôn ngữ", where: "Bạn đang ở đâu?", otherCity: "Thành phố khác…",
    useDevice: "Dùng giờ của điện thoại · {city}", search: "Hoặc tìm thành phố của bạn",
    placeholder: "VD: Sydney, London, Dubai", noCity: "Không tìm thấy thành phố. Hãy thử một thành phố lớn gần đó.",
    nowIn: "Giờ hiện tại ở {zone}:", next: "Tiếp theo", live: "Đang diễn ra", until: "đến {time}", inDays: "còn {d} ngày {h} giờ", inHours: "còn {h} giờ {m} phút", inMins: "còn {m} phút",
    session: "Buổi {n}", complete: "Kỳ nhóm đã kết thúc", thanks: "Cảm ơn bạn đã tham dự",
    begins: "Bắt đầu", final: "Buổi cuối", schedule: "Lịch trình",
    allHost: "Tất cả thời gian theo giờ {host} ({hostAbbr}).",
    shownIn: "Hiển thị theo giờ {zone} ({abbr}). Giờ {host} được ghi dưới mỗi buổi.",
    lateNight: "Đêm khuya", zoom: "Họp Zoom", meetingId: "Meeting ID", passcode: "Mật mã",
    tbd: "Sẽ thông báo sau", copy: "Sao chép", copied: "Đã sao chép", selected: "Đã chọn", join: "Mở trong Zoom",
    footer: "Thời gian các buổi nhóm theo giờ {host} ({hostAbbr}). Giờ ở khu vực khác được tự động chuyển đổi.",
    zones: { th: "Thái Lan", mm: "Myanmar", vn: "Việt Nam", ph: "Philippines", kr: "Hàn Quốc", eu: "Châu Âu", ca: "California", to: "Canada" },
  },
  fil: {
    label: "Filipino", locale: "fil-PH",
    share: "Ibahagi sa kapwa saserdote", linkCopied: "Nakopya ang link",
    language: "Wika", where: "Nasaan ka ngayon?", otherCity: "Ibang lungsod…",
    useDevice: "Gamitin ang oras ng aking telepono · {city}", search: "O hanapin ang iyong lungsod",
    placeholder: "hal. Sydney, London, Dubai", noCity: "Walang nahanap na lungsod. Subukan ang kalapit na malaking lungsod.",
    nowIn: "Oras ngayon sa {zone}:", next: "Susunod", live: "Kasalukuyang nagaganap", until: "hanggang {time}", inDays: "{d} araw {h} oras pa", inHours: "{h} oras {m} min pa", inMins: "{m} min pa",
    session: "Pulong {n}", complete: "Tapos na ang pagtitipon", thanks: "Salamat sa inyong pagdalo",
    begins: "Simula", final: "Huling pulong", schedule: "Iskedyul",
    allHost: "Lahat ng oras ay sa oras ng {host} ({hostAbbr}).",
    shownIn: "Ipinapakita sa oras ng {zone} ({abbr}). Nakalista sa ilalim ng bawat pulong ang oras sa {host}.",
    lateNight: "Hatinggabi", zoom: "Zoom meeting", meetingId: "Meeting ID", passcode: "Passcode",
    tbd: "Iaanunsyo pa", copy: "Kopyahin", copied: "Nakopya", selected: "Napili", join: "Buksan sa Zoom",
    footer: "Ang mga oras ng pulong ay nakatakda sa oras ng {host} ({hostAbbr}). Awtomatikong kino-convert ang oras sa ibang lugar.",
    zones: { th: "Thailand", mm: "Myanmar", vn: "Vietnam", ph: "Pilipinas", kr: "Korea", eu: "Europa", ca: "California", to: "Canada" },
  },
  zh: {
    label: "简体中文", locale: "zh-CN",
    share: "分享给同作祭司的人", linkCopied: "链接已复制",
    language: "语言", where: "您现在在哪里？", otherCity: "其他城市…",
    useDevice: "使用手机时间 · {city}", search: "或搜索您的城市",
    placeholder: "例如 Sydney、London、Dubai", noCity: "找不到该城市。请尝试附近的大城市。",
    nowIn: "{zone}当前时间：", next: "下一场", live: "进行中", until: "至 {time}", inDays: "{d}天{h}小时后", inHours: "{h}小时{m}分钟后", inMins: "{m}分钟后",
    session: "第{n}堂", complete: "聚会已全部结束", thanks: "感谢您的参与",
    begins: "开始", final: "最后一堂", schedule: "日程",
    allHost: "所有时间均为{host}时间（{hostAbbr}）。",
    shownIn: "按{zone}时间（{abbr}）显示，每场聚会下方另附{host}时间。",
    lateNight: "深夜", zoom: "Zoom 会议", meetingId: "会议号", passcode: "密码",
    tbd: "待定", copy: "复制", copied: "已复制", selected: "已选中", join: "在 Zoom 中打开",
    footer: "聚会时间以{host}时间（{hostAbbr}）为准，其他地区时间会自动换算。",
    zones: { th: "泰国", mm: "缅甸", vn: "越南", ph: "菲律宾", kr: "韩国", eu: "欧洲", ca: "加利福尼亚", to: "加拿大" },
  },
  ko: {
    label: "한국어", locale: "ko-KR",
    share: "동역하는 제사장들에게 공유", linkCopied: "링크가 복사되었습니다",
    language: "언어", where: "지금 어디에 계신가요?", otherCity: "다른 도시…",
    useDevice: "내 기기 시간 사용 · {city}", search: "또는 도시 검색",
    placeholder: "예: Sydney, London, Dubai", noCity: "도시를 찾을 수 없습니다. 가까운 큰 도시로 검색해 보세요.",
    nowIn: "{zone} 현재 시각:", next: "다음", live: "진행 중", until: "{time}까지", inDays: "{d}일 {h}시간 후", inHours: "{h}시간 {m}분 후", inMins: "{m}분 후",
    session: "{n}번째 집회", complete: "집회가 모두 끝났습니다", thanks: "함께해 주셔서 감사합니다",
    begins: "시작", final: "마지막 집회", schedule: "일정",
    allHost: "모든 시간은 {host} 시간({hostAbbr}) 기준입니다.",
    shownIn: "{zone} 시간({abbr}) 기준입니다. 각 집회 아래에 {host} 시간을 함께 표시합니다.",
    lateNight: "심야", zoom: "Zoom 회의", meetingId: "회의 ID", passcode: "암호",
    tbd: "추후 공지", copy: "복사", copied: "복사됨", selected: "선택됨", join: "Zoom으로 열기",
    footer: "집회 시간은 {host} 시간({hostAbbr}) 기준이며, 다른 지역 시간은 자동으로 변환됩니다.",
    zones: { th: "태국", mm: "미얀마", vn: "베트남", ph: "필리핀", kr: "한국", eu: "유럽", ca: "캘리포니아", to: "캐나다" },
  },
  de: {
    label: "Deutsch", locale: "de-DE",
    share: "Mit Mitpriestern teilen", linkCopied: "Link kopiert",
    language: "Sprache", where: "Wo bist du gerade?", otherCity: "Andere Stadt…",
    useDevice: "Zeit meines Geräts verwenden · {city}", search: "Oder nach deiner Stadt suchen",
    placeholder: "z. B. Sydney, London, Dubai", noCity: "Keine Stadt gefunden. Versuche eine größere Stadt in der Nähe.",
    nowIn: "Jetzt in {zone}:", next: "Nächstes", live: "Läuft gerade", until: "bis {time}", inDays: "in {d} T. {h} Std.", inHours: "in {h} Std. {m} Min.", inMins: "in {m} Min.",
    session: "Treffen {n}", complete: "Die Konferenz ist beendet", thanks: "Danke für deine Teilnahme",
    begins: "Beginn", final: "Letztes Treffen", schedule: "Programm",
    allHost: "Alle Zeiten in Ortszeit {host} ({hostAbbr}).",
    shownIn: "Zeiten für {zone} ({abbr}). Die Ortszeit {host} steht unter jedem Treffen.",
    lateNight: "Spät nachts", zoom: "Zoom-Meeting", meetingId: "Meeting-ID", passcode: "Kenncode",
    tbd: "Wird noch bekannt gegeben", copy: "Kopieren", copied: "Kopiert", selected: "Markiert", join: "In Zoom öffnen",
    footer: "Die Zeiten richten sich nach Ortszeit {host} ({hostAbbr}). Zeiten in anderen Zonen werden automatisch umgerechnet.",
    zones: { th: "Thailand", mm: "Myanmar", vn: "Vietnam", ph: "Philippinen", kr: "Korea", eu: "Europa", ca: "Kalifornien", to: "Kanada" },
  },
};

// Filled in by start() once event.json has loaded
let EVENT, SESSIONS, HOST, current;

// Language: ?lang=xx link, then the saved choice, then the browser's language, else English
const matchLang = code => {
  code = (code || "").toLowerCase();
  if (code.startsWith("tl")) return "fil";
  return Object.keys(TEXT).find(k => code === k || code.startsWith(k + "-")) || null;
};
let lang = matchLang(new URLSearchParams(location.search).get("lang"));
if (!lang) { try { lang = matchLang(localStorage.getItem("lang")); } catch (e) {} }
if (!lang) lang = (navigator.languages || [navigator.language]).map(matchLang).find(Boolean) || "en";

const L = () => TEXT[lang];
const t = (key, vars = {}) => L()[key].replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : m);
// Event text is stored per language; anything not translated yet falls back to English
const pick = obj => (obj && (obj[lang] || obj.en)) || "";
const esc = str => String(str).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const zoneName = z => z.id === "custom" ? z.name : L().zones[z.id];

// Add the viewer's own zone if it isn't one of the listed ones
const deviceTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })();
const findListed = tz => ZONES.find(z => z.tz === tz || (z.also || []).includes(tz));
const cityOf = tz => tz.split("/").pop().replace(/_/g, " ");
const makeCustom = tz => ({ id: "custom", name: cityOf(tz), place: tz.split("/")[0].replace(/_/g, " "), tz, abbr: null });
const validTz = tz => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch (e) { return false; } };

function pickZone(tz) {
  return findListed(tz) || (validTz(tz) ? makeCustom(tz) : HOST);
}

let saved = null;
try { saved = localStorage.getItem("zone"); } catch (e) {}
// A link ending in #vn, #ph, etc. opens with that region selected
const fromHash = () => ZONES.find(z => z.id === location.hash.slice(1).toLowerCase());


function choose(z) {
  current = z;
  try { localStorage.setItem("zone", z.id === "custom" ? "tz:" + z.tz : z.id); } catch (e) {}
  document.getElementById("picker").hidden = true;
  renderSelect();
  render();
}

// Gregorian calendar and Latin digits in every language (Thai would otherwise show year 2569, Burmese its own digits)
const fmt = (tz, opts, locale = "en-US") => new Intl.DateTimeFormat(locale + "-u-ca-gregory-nu-latn", { timeZone: tz, ...opts });
const abbrOf = (z, date) => z.abbr || (fmt(z.tz, { timeZoneName: "short" }).formatToParts(date).find(p => p.type === "timeZoneName") || {}).value || "";
// 12- or 24-hour clock follows the language; the day period may come before the time (Korean 오후 7:00)
const timeParts = (z, d) => {
  const parts = fmt(z.tz, { hour: "numeric", minute: "2-digit" }, L().locale).formatToParts(d);
  const get = type => (parts.find(p => p.type === type) || {}).value;
  const ap = get("dayPeriod") || "";
  return {
    hm: `${ap ? get("hour") : get("hour").padStart(2, "0")}:${get("minute")}`, ap,
    apFirst: !!ap && parts.findIndex(p => p.type === "dayPeriod") < parts.findIndex(p => p.type === "hour"),
    h24: +fmt(z.tz, { hour: "numeric", hourCycle: "h23" }).format(d),
  };
};
const dayLabel = (z, d) => fmt(z.tz, { weekday: "short", month: "short", day: "numeric" }, L().locale).format(d);
const timeStr = (z, d) => { const p = timeParts(z, d); return !p.ap ? p.hm : p.apFirst ? `${p.ap} ${p.hm}` : `${p.hm} ${p.ap}`; };

const zoneText = z => `${zoneName(z)} · ${z.place} (${abbrOf(z, SESSIONS[0].start)})`;

// Rebuilt only when the zone or language changes, so the 30s refresh never disturbs an open dropdown
function renderSelect() {
  const sel = document.getElementById("zoneSelect");
  sel.innerHTML = "";
  ZONES.forEach(z => sel.add(new Option(zoneText(z), z.id)));
  if (current.id === "custom") sel.add(new Option(zoneText(current), "custom"));
  sel.add(new Option(t("otherCity"), "other"));
  sel.value = document.getElementById("picker").hidden ? current.id : "other";
}

function applyLang() {
  document.documentElement.lang = L().locale.split("-")[0];
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  document.getElementById("tzSearch").placeholder = t("placeholder");
  document.getElementById("langSelect").value = lang;
  renderEvent();
  renderZoom();
  if (deviceTz) document.getElementById("useDevice").textContent = t("useDevice", { city: cityOf(deviceTz) });
  showResults(document.getElementById("tzSearch").value);
  renderSelect();
  render();
}

function renderEvent() {
  document.title = EVENT.title;
  document.getElementById("title").textContent = EVENT.title;
  document.getElementById("place").textContent = pick(EVENT.place);
  const theme = document.getElementById("theme"), [b, sub] = theme.children;
  b.textContent = pick(EVENT.theme);
  sub.textContent = pick(EVENT.themeSub);
  b.hidden = !b.textContent; sub.hidden = !sub.textContent;
  theme.hidden = b.hidden && sub.hidden;
  document.getElementById("footer").textContent = t("footer", hostVars());
}

const hostVars = () => ({ host: zoneName(HOST), hostAbbr: abbrOf(HOST, SESSIONS[0] ? SESSIONS[0].start : new Date()) });

function renderZoom() {
  const zoom = EVENT.zoom || {};
  [["zid", zoom.id || ""], ["zpw", zoom.passcode || ""]].forEach(([id, v]) => {
    const el = document.getElementById(id), btn = document.querySelector(`.copy[data-target="${id}"]`);
    el.textContent = v || t("tbd");
    el.classList.toggle("tbd", !v);
    btn.hidden = !v;
    btn.dataset.copy = v.replace(/\s/g, "");
  });
  const join = document.getElementById("zjoin");
  join.hidden = !zoom.id;
  if (zoom.id) join.href = zoom.link || "https://zoom.us/j/" + zoom.id.replace(/\s/g, "");
}

const langSel = document.getElementById("langSelect");
Object.entries(TEXT).forEach(([k, v]) => langSel.add(new Option(v.label, k)));
langSel.addEventListener("change", e => {
  lang = e.target.value;
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
});

const ALL_TZ = (() => {
  try { return Intl.supportedValuesOf("timeZone").filter(t => t.includes("/") && !t.startsWith("Etc/")); }
  catch (e) { return []; }
})();
const offsetOf = tz => {
  try {
    return (fmt(tz, { timeZoneName: "shortOffset" }).formatToParts(SESSIONS[0].start).find(p => p.type === "timeZoneName") || {}).value || "";
  } catch (e) { return ""; }
};

function openPicker() {
  document.getElementById("picker").hidden = false;
  document.getElementById("useDevice").hidden = !deviceTz;
  document.getElementById("tzSearch").value = "";
  showResults("");
}

document.getElementById("zoneSelect").addEventListener("change", e => {
  const v = e.target.value;
  if (v === "other") openPicker();
  else if (v !== "custom") choose(ZONES.find(z => z.id === v));
  else document.getElementById("picker").hidden = true;
});

function showResults(q) {
  const ul = document.getElementById("tzResults");
  q = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) { ul.innerHTML = ""; return; }
  const hits = ALL_TZ.filter(t => t.toLowerCase().replace(/_/g, " ").includes(q)).slice(0, 12);
  if (!hits.length) {
    ul.innerHTML = `<li class="empty">${t("noCity")}</li>`;
    return;
  }
  ul.innerHTML = "";
  hits.forEach(t => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span>${cityOf(t)} <small style="color:var(--muted)">${t.split("/")[0].replace(/_/g, " ")}</small></span><span>${offsetOf(t)}</span>`;
    b.addEventListener("click", () => choose(pickZone(t)));
    li.appendChild(b); ul.appendChild(li);
  });
}

window.addEventListener("hashchange", () => { const z = fromHash(); if (z) choose(z); });
document.getElementById("tzSearch").addEventListener("input", e => showResults(e.target.value));
document.getElementById("useDevice").addEventListener("click", () => deviceTz && choose(pickZone(deviceTz)));

function countdown(ms) {
  const m = Math.round(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor(m / 60) % 24, mm = m % 60;
  if (d > 0) return t("inDays", { d, h });
  if (h > 0) return t("inHours", { h, m: mm });
  return t("inMins", { m: mm });
}

function render() {
  const z = current, now = new Date(), name = zoneName(z);

  document.getElementById("now").innerHTML =
    `${t("nowIn", { zone: name })} <b>${dayLabel(z, now)}, ${timeStr(z, now)}</b> ${abbrOf(z, now)}`;

  if (!SESSIONS.length) return;
  const first = SESSIONS[0].start, last = SESSIONS[SESSIONS.length - 1].start;
  // Meeting dates are calendar dates, shown as entered (falling back to the first and last session)
  const d = EVENT.dates || {}, asDay = str => str ? new Date(str + "T12:00:00Z") : null;
  const from = asDay(d.start) || first, to = asDay(d.end) || last;
  const range = fmt(d.start ? "UTC" : z.tz, { year: "numeric", month: "short", day: "numeric" }, L().locale);
  document.getElementById("dates").textContent = range.formatRange ? range.formatRange(from, to) : `${range.format(from)} – ${range.format(to)}`;

  document.getElementById("overview").innerHTML = `
    <div><span class="lbl">${t("begins")}</span><span class="val">${dayLabel(z, first)}</span><span class="val">${timeStr(z, first)}</span></div>
    <div><span class="lbl">${t("final")}</span><span class="val">${dayLabel(z, last)}</span><span class="val">${timeStr(z, last)}</span></div>`;

  // While a meeting is running the card shows it; once it ends, the card moves on to the next one
  const liveIdx = SESSIONS.findIndex(s => s.start <= now && now < s.end);
  const nextIdx = SESSIONS.findIndex(s => s.start > now);
  const nextEl = document.getElementById("next");
  const name_ = s => [s.no && t("session", { n: s.no }), esc(pick(s.title))].filter(Boolean).join(" · ");
  nextEl.classList.toggle("live", liveIdx !== -1);
  if (liveIdx !== -1) {
    const s = SESSIONS[liveIdx];
    nextEl.innerHTML = `<span class="k"><span class="dot" aria-hidden="true"></span>${t("live")} · ${t("until", { time: timeStr(z, s.end) })}</span>
      <span class="t">${name_(s)}</span>
      <span class="s">${dayLabel(z, s.start)} · ${timeStr(z, s.start)} – ${timeStr(z, s.end)} ${abbrOf(z, s.start)}</span>`;
  } else if (nextIdx !== -1) {
    const s = SESSIONS[nextIdx];
    nextEl.innerHTML = `<span class="k">${t("next")} · ${countdown(s.start - now)}</span>
      <span class="t">${name_(s)}</span>
      <span class="s">${dayLabel(z, s.start)} · ${timeStr(z, s.start)} ${abbrOf(z, s.start)}</span>`;
  } else {
    nextEl.innerHTML = `<span class="k">${t("complete")}</span><span class="t">${t("thanks")}</span>`;
  }

  document.getElementById("schedSub").textContent = z === HOST
    ? t("allHost", hostVars())
    : t("shownIn", { ...hostVars(), zone: name, abbr: abbrOf(z, first) });

  const groups = new Map();
  SESSIONS.forEach(s => {
    const key = dayLabel(z, s.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });
  let html = "";
  groups.forEach((list, day) => {
    html += `<div class="day"><h3>${day}</h3><ul class="sessions">`;
    list.forEach(s => {
      const p = timeParts(z, s.start), topic = esc(pick(s.topic));
      const title = esc(pick(s.title)) || (s.no ? t("session", { n: s.no }) : "");
      const past = s.end <= now;
      const pills = [];
      if (s.i === liveIdx) pills.push(`<span class="pill live-p"><span class="dot" aria-hidden="true"></span>${t("live")}</span>`);
      if (s.i === nextIdx) pills.push(`<span class="pill ${liveIdx === -1 ? "next-p" : "soon-p"}">${t("next")}</span>`);
      if (p.h24 < 6 || p.h24 >= 23) pills.push(`<span class="pill night">${t("lateNight")}</span>`);
      const ref = z === HOST ? "" : `<span class="ref">${dayLabel(HOST, s.start)} · ${timeStr(HOST, s.start)} ${abbrOf(HOST, s.start)}</span>`;
      const time = !p.ap ? p.hm : p.apFirst ? `<small class="pre">${p.ap}</small>${p.hm}` : `${p.hm}<small>${p.ap}</small>`;
      html += `<li class="${past ? "past" : ""}">
        <span class="time">${time}</span>
        <div class="what"><strong>${s.no ? `<span class="num" aria-label="${t("session", { n: s.no })}">${s.no}</span>` : `<span class="num blank" aria-hidden="true"></span>`}<span>${title}</span></strong>${topic ? `<span class="topic">${topic}</span>` : ""}${ref}${pills.length ? `<div class="pills">${pills.join("")}</div>` : ""}</div>
      </li>`;
    });
    html += `</ul></div>`;
  });
  document.getElementById("schedule").innerHTML = html;
}

// Wall-clock date and time in the host's zone → the actual moment (handles DST)
function hostMoment(date, time, tz) {
  const [y, mo, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const offset = ts => {
    const p = Object.fromEntries(fmt(tz, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" })
      .formatToParts(ts).map(x => [x.type, x.value]));
    return Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute) - ts;
  };
  let ts = wall - offset(wall);
  ts = wall - offset(ts);
  return new Date(ts);
}

// A meeting counts as in progress for this long after it starts (an entry can set its own "duration" in minutes)
const DEFAULT_MINUTES = 120;

function start(ev) {
  EVENT = ev;
  const tz = validTz(ev.hostTz) ? ev.hostTz : "Asia/Bangkok";
  HOST = findListed(tz) || { ...makeCustom(tz), abbr: ev.hostAbbr || null };
  if (ev.hostAbbr && HOST.id !== "custom") HOST = { ...HOST, abbr: ev.hostAbbr };
  let n = 0;
  SESSIONS = (ev.sessions || [])
    .map(s => { const start = hostMoment(s.date, s.time, tz); return { ...s, start, end: new Date(+start + (s.duration || DEFAULT_MINUTES) * 6e4) }; })
    .sort((a, b) => a.start - b.start)
    .map((s, i) => ({ ...s, i, no: s.numbered ? ++n : null }));
  // If the next meeting starts within that window, this one ends when the next begins
  SESSIONS.forEach((s, i) => { const nx = SESSIONS[i + 1]; if (nx && nx.start < s.end) s.end = nx.start; });
  const hostIdx = ZONES.findIndex(z => z.id === HOST.id);
  if (hostIdx >= 0) ZONES[hostIdx] = HOST;
  current = fromHash() || (saved && saved.startsWith("tz:") ? pickZone(saved.slice(3))
    : ZONES.find(z => z.id === saved) || (deviceTz ? pickZone(deviceTz) : HOST));
  applyLang();
  setInterval(render, 30000);
}

fetch("event.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(start)
  .catch(() => {
    document.getElementById("schedule").textContent = "Could not load the schedule. Please refresh the page.";
  });

// Phones open the share sheet (KakaoTalk, LINE, WhatsApp…); elsewhere the link is copied.
// The plain address is shared so each recipient gets their own language and time zone.
document.getElementById("share").addEventListener("click", async () => {
  const url = location.origin + location.pathname;
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url }); } catch (e) {}
    return;
  }
  const label = document.querySelector("#share [data-t]");
  try { await navigator.clipboard.writeText(url); }
  catch (e) {
    const tmp = document.createElement("textarea");
    tmp.value = url; document.body.appendChild(tmp); tmp.select();
    try { document.execCommand("copy"); } catch (e2) {}
    tmp.remove();
  }
  label.textContent = t("linkCopied");
  setTimeout(() => (label.textContent = t("share")), 2000);
});

document.querySelectorAll(".copy").forEach(btn => {
  btn.addEventListener("click", () => {
    const done = () => { btn.textContent = t("copied"); setTimeout(() => (btn.textContent = t("copy")), 1500); };
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(document.getElementById(btn.dataset.target));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = t("selected");
    };
    try { navigator.clipboard.writeText(btn.dataset.copy).then(done, fallback); } catch (e) { fallback(); }
  });
});
