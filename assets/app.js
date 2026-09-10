/* 집회 참가 접수 - 단계형(마법사) 접수 폼
 * 한 화면에 한 부문씩. 위아래 스크롤 없이 이전/다음으로 이동.
 */
(function () {
  "use strict";

  var CFG = window.APP_CONFIG || {};
  var PREVIEW = !CFG.scriptUrl;
  var $ = function (id) { return document.getElementById(id); };

  /* 양식 다듬는 동안 필수값 검사를 끔. 완성되면 true 로 되돌리세요. */
  var VALIDATE = false;

  var comp = CFG.companions || { askAdultChild: true };
  var costNotice = CFG.costNotice || { enabled: false };
  var meals = CFG.meals || { enabled: false };
  var lodge = CFG.lodging || { enabled: false };
  var tp = CFG.transport || { enabled: false };
  var SCHEDULES = CFG.schedules || [];

  var lodgeNights = lodge.enabled
    ? (lodge.nights && lodge.nights.length
        ? lodge.nights : [{ id: "stay_total", label: "숙박 총 인원" }])
    : [];

  /* 식사: 날짜(행)별로 끼니를 묶음. days 가 없으면 items(평면) 또는 단일 칸으로 대체 */
  var mealDays = meals.enabled
    ? (meals.days && meals.days.length
        ? meals.days
        : [{ date: "", meals: (meals.items && meals.items.length)
              ? meals.items : [{ id: "meal_total", label: "식사 총 인원" }] }])
    : [];
  var mealItems = [];
  mealDays.forEach(function (d) {
    d.meals.forEach(function (m) {
      mealItems.push({ id: m.id, label: (d.date ? d.date + " " : "") + m.label });
    });
  });

  /* --------------------------------------------------------------- 상태 */
  var state = {
    name: "",
    adults: 0, kids: 0, companionTotal: 0,
    names: [],
    scheds: [],
    meals: {},
    lodging: {},
    transport: "", departure: "",
    notes: "",
  };

  function companionCount() {
    return comp.askAdultChild ? (n(state.adults) + n(state.kids)) : n(state.companionTotal);
  }
  function totalCount() { return 1 + companionCount(); }
  function labelOf(id) {
    for (var i = 0; i < SCHEDULES.length; i++) if (SCHEDULES[i].id === id) return SCHEDULES[i].label;
    return id;
  }

  /* --------------------------------------------------------- 단계 정의 */
  var steps = [{ id: "intro", intro: true }];
  if (costNotice.enabled)
    steps.push({ id: "costNotice", notice: true });
  steps.push({ id: "applicant", title: "신청자 정보", desc: "신청자 정보를 입력해 주세요.",
    render: renderApplicant, bind: bindApplicant, validate: valApplicant });
  if (SCHEDULES.length)
    steps.push({ id: "schedules", title: "참석 일정", desc: "참석하실 세션을 모두 선택하세요.",
      render: renderSchedules, bind: bindSchedules, validate: valSchedules });
  if (meals.enabled)
    steps.push({ id: "meals", title: meals.label || "식사 신청",
      desc: "식사 별 신청 인원을 입력해 주세요",
      render: renderMeals, bind: bindMeals });
  if (lodge.enabled)
    steps.push({ id: "lodging", title: lodge.label || "숙박 신청",
      desc: lodge.desc || "숙박하실 날짜별 인원을 입력해 주세요",
      render: renderLodging, bind: bindLodging });
  if (tp.enabled)
    steps.push({ id: "transport", title: tp.label || "차량", desc: tp.desc || "차량 이용 여부를 선택하세요.",
      render: renderTransport, bind: bindTransport });
  if (CFG.showNotes)
    steps.push({ id: "notes", title: "기타 요청사항", desc: "없으면 비워두셔도 됩니다.",
      render: renderNotes, bind: bindNotes });
  steps.push({ id: "review", title: "입력 확인",
    desc: "아래 내용으로 접수합니다. 고칠 항목이 있으면 '이전'을 누르세요.",
    render: renderReview });

  var LAST = steps.length - 1;
  var idx = 0;

  /* 인트로·안내 화면은 STEP 번호에서 제외하고, 입력 단계만 1..N 으로 센다 */
  var stepNo = {}, stepTotal = 0;
  steps.forEach(function (s, i) {
    if (!s.intro && !s.notice) { stepTotal++; stepNo[i] = stepTotal; }
  });

  /* --------------------------------------------------------- 렌더 엔진 */
  function render() {
    var step = steps[idx];
    var stage = $("stage");

    if (step.intro) {
      $("progressBar").style.width = "0%";
      stage.innerHTML = introHTML();
      $("nav").hidden = true;
      var sb = $("startBtn");
      if (sb) sb.addEventListener("click", function () { go(1); });
      return;
    }

    if (step.notice) {
      $("progressBar").style.width = "0%";
      stage.innerHTML = noticeHTML();
      $("nav").hidden = false;
      $("prevBtn").classList.remove("is-hidden");
      $("navMeta").textContent = "";
      $("nextBtn").textContent = "다음";
      bindNotice(stage);
      $("stage").scrollTop = 0;
      return;
    }

    $("progressBar").style.width = (stepNo[idx] / stepTotal * 100) + "%";
    stage.innerHTML =
      '<section class="step">' +
        '<div class="step__eyebrow">STEP ' + stepNo[idx] + " / " + stepTotal + "</div>" +
        '<h1 class="step__title">' + esc(step.title) + "</h1>" +
        (step.desc ? '<p class="step__desc">' + esc(step.desc) + "</p>" : "") +
        '<div class="step__body" id="stepBody"></div>' +
        '<div class="msg" id="stepMsg"></div>' +
      "</section>";
    refreshBody();

    $("nav").hidden = false;
    $("prevBtn").classList.toggle("is-hidden", idx <= 0);
    $("navMeta").textContent = stepNo[idx] + " / " + stepTotal;
    $("nextBtn").textContent = (idx === LAST) ? "제출하기" : "다음";
    $("stage").scrollTop = 0;
  }

  function refreshBody() {
    var step = steps[idx];
    var body = $("stepBody");
    body.innerHTML = step.render();
    if (step.bind) step.bind(body);
  }

  function go(d) {
    var step = steps[idx];
    if (VALIDATE && d > 0 && step.validate) {
      var err = step.validate();
      if (err) { showMsg(err); return; }
    }
    if (d > 0 && idx === LAST) { submit(); return; }
    idx = Math.max(0, Math.min(LAST, idx + d));
    render();
  }

  /* --------------------------------------------------------- 인트로 */
  function introHTML() {
    return (
      '<div class="intro">' +
        (PREVIEW
          ? '<div class="ribbon">미리보기 모드 — <code>assets/config.js</code> 의 <code>scriptUrl</code> 이 비어 있어 제출해도 저장되지 않습니다.</div>'
          : "") +
        '<div class="intro__badge">' + esc(CFG.eventSubtitle || "참가 접수") + "</div>" +
        '<h1 class="intro__title">' + esc(CFG.eventTitle || "집회 참가 접수") + "</h1>" +
        "<dl>" +
          "<dt>일시</dt><dd>" + esc(CFG.eventPeriod || "-") + "</dd>" +
          "<dt>장소</dt><dd>" + placeHTML() + "</dd>" +
        "</dl>" +
        (CFG.contactInfo ? '<div class="hint">' + esc(CFG.contactInfo) + "</div>" : "") +
        (CFG.deadlineNotice ? '<div class="intro__deadline">' + esc(CFG.deadlineNotice) + "</div>" : "") +
        '<div class="intro__cta"><button type="button" class="btn btn--block" id="startBtn">등록하기</button></div>' +
        '<div class="tiny-link"><a href="admin.html">관리자 화면 →</a></div>' +
      "</div>"
    );
  }

  function placeHTML() {
    var name = CFG.eventPlace ? esc(CFG.eventPlace) : "";
    var addr = CFG.eventPlaceAddress || "";
    if (!addr) return name || "-";
    var addrHTML = CFG.eventPlaceMapUrl
      ? '<a class="intro__addr" href="' + esc(CFG.eventPlaceMapUrl) +
        '" target="_blank" rel="noopener">' + esc(addr) + "</a>"
      : '<span class="intro__addr">' + esc(addr) + "</span>";
    return (name ? name + "<br>" : "") + addrHTML;
  }

  /* --------------------------------------------------- 비용 안내 화면 */
  function noticeHTML() {
    var c = costNotice || {};
    var h = '<section class="notice">';
    if (c.prayerText) h += '<p class="notice__prayer">' + esc(c.prayerText) + "</p>";
    h += '<h1 class="notice__title">' + esc(c.title || "집회 비용 안내") + "</h1>";
    if (c.leadText) h += '<p class="notice__lead">' + esc(c.leadText) + "</p>";

    (c.groups || []).forEach(function (g) {
      h += '<div class="cost-group">';
      if (g.name) h += '<div class="cost-group__name">' + esc(g.name) + "</div>";
      (g.rows || []).forEach(function (r) {
        h += '<div class="cost-row">' +
          '<span class="cost-row__label">' +
          (r.icon ? '<span class="cost-row__icon" aria-hidden="true">' + esc(r.icon) + "</span>" : "") +
          esc(r.label) +
          (r.unit ? ' <span class="cost-row__unit">· ' + esc(r.unit) + "</span>" : "") +
          "</span>" +
          '<span class="cost-row__amount">' + esc(r.amount) + "</span>" +
        "</div>";
      });
      h += "</div>";
    });

    if (c.closingText) h += '<p class="notice__closing">' + esc(c.closingText) + "</p>";

    if (c.account) {
      var acctLines = [].concat(c.account);
      var acctCopy = acctLines.join(" ");
      h += '<div class="account-box">' +
        '<div class="account-box__label">' + esc(c.accountLabel || "헌금 계좌") + "</div>" +
        '<div class="account-box__row">' +
          '<span class="account-box__value" id="acctValue" data-copy="' + esc(acctCopy) + '">' +
            acctLines.map(function (ln) { return esc(ln); }).join("<br>") +
          "</span>" +
          '<button type="button" class="btn btn--ghost btn--sm" id="acctCopy">복사</button>' +
        "</div>" +
      "</div>";
    }
    h += "</section>";
    return h;
  }

  function bindNotice(root) {
    var btn = root.querySelector("#acctCopy");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var val = root.querySelector("#acctValue");
      var txt = (val ? (val.getAttribute("data-copy") || val.textContent) : "").trim();
      var ok = function () {
        btn.textContent = "복사됨 ✓";
        setTimeout(function () { btn.textContent = "복사"; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(ok, function () { fallbackCopy(txt, ok); });
      } else {
        fallbackCopy(txt, ok);
      }
    });
  }

  function fallbackCopy(txt, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (done) done();
    } catch (e) {}
  }

  /* --------------------------------------------------------- 1) 신청자 정보 */
  function renderApplicant() {
    var h = "";
    h += '<div class="field"><label class="lbl">이름<span class="req">*</span></label>' +
      '<input type="text" id="f_name" autocomplete="name" value="' + esc(state.name) + '"></div>';

    if (comp.askAdultChild) {
      h += '<div class="field"><label class="lbl">동반 인원 <span class="hint" style="font-weight:400">(본인 제외)</span></label>' +
        '<div class="row">' +
          '<div><label class="lbl" style="font-size:.85em">' + esc(comp.adultLabel || "동반 성인 수") + "</label>" +
            stepper("adults", state.adults) + "</div>" +
          '<div><label class="lbl" style="font-size:.85em">' + esc(comp.childLabel || "동반 어린이 수") + "</label>" +
            stepper("kids", state.kids) + "</div>" +
        "</div>" +
        (comp.note ? '<div class="hint">' + esc(comp.note) + "</div>" : "") +
        '<div id="companionNames"></div>' +
        "</div>";
    } else {
      h += '<div class="field"><label class="lbl">동반 인원 수 (본인 제외)</label>' +
        stepper("companionTotal", state.companionTotal) +
        '<div id="companionNames"></div>' +
        "</div>";
    }
    h += '<div class="total-line" id="totalLine"></div>';
    return h;
  }

  function bindApplicant(root) {
    bindText(root, "f_name", "name");
    bindSteppers(root);
    refreshTotalLine();
    syncCompanionNames();
  }

  /* 동반 인원 수만큼 이름 입력칸을 만들고, 이미 입력한 이름은 유지 */
  function syncCompanionNames() {
    var box = $("companionNames");
    if (!box) return;
    var count = companionCount();
    state.names.length = count;
    for (var i = 0; i < count; i++) if (state.names[i] == null) state.names[i] = "";

    if (count === 0) { box.innerHTML = ""; return; }
    box.innerHTML =
      '<label class="lbl" style="margin-top:10px">동반자 이름</label>' +
      '<div class="companion-names">' +
      state.names.map(function (nm, i) {
        return '<input type="text" class="cn-input" data-i="' + i +
          '" placeholder="' + (i + 1) + '번째 동반자" value="' + esc(nm) + '">';
      }).join("") +
      "</div>";
    box.querySelectorAll(".cn-input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        state.names[parseInt(inp.getAttribute("data-i"), 10)] = inp.value;
      });
    });
  }

  function refreshTotalLine() {
    var el = $("totalLine");
    if (!el) return;
    var c = companionCount();
    el.textContent = c > 0
      ? "총 참석 인원 " + totalCount() + "명 (본인 + 동반 " + c + "명)"
      : "총 참석 인원 본인 1명";
  }
  function valApplicant() {
    if (!state.name.trim()) return "이름을 입력해 주세요.";
    return null;
  }

  /* --------------------------------------------------------- 2) 참석 일정 */
  function renderSchedules() {
    var all = state.scheds.length === SCHEDULES.length && SCHEDULES.length > 0;
    var h = '<div class="inline-actions">' +
      '<button type="button" class="btn btn--ghost btn--sm" id="allSched">' +
      (all ? "전체 해제" : "전체 참석") + "</button></div>";
    h += '<div class="checks">';
    SCHEDULES.forEach(function (s) {
      var on = state.scheds.indexOf(s.id) >= 0;
      h += '<label class="check' + (on ? " is-on" : "") + '">' +
        '<input type="checkbox" value="' + esc(s.id) + '"' + (on ? " checked" : "") + ">" +
        "<span>" + esc(s.label) + "</span></label>";
    });
    h += "</div>";
    return h;
  }
  function bindSchedules(root) {
    root.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        var id = cb.value;
        var i = state.scheds.indexOf(id);
        if (cb.checked && i < 0) state.scheds.push(id);
        if (!cb.checked && i >= 0) state.scheds.splice(i, 1);
        cb.closest(".check").classList.toggle("is-on", cb.checked);
        refreshBody();
      });
    });
    root.querySelector("#allSched").addEventListener("click", function () {
      state.scheds = state.scheds.length === SCHEDULES.length
        ? [] : SCHEDULES.map(function (s) { return s.id; });
      refreshBody();
    });
  }
  function valSchedules() {
    return state.scheds.length ? null : "참석 일정을 하나 이상 선택해 주세요.";
  }

  /* --------------------------------------------------------- 3) 식사 */
  function renderMeals() {
    var cap = totalCount();
    var h = '<div class="inline-actions">' +
      '<button type="button" class="btn btn--ghost btn--sm" id="mealAll">전체 인원(' + cap + "명) 일괄 적용</button>" +
      '<button type="button" class="btn btn--ghost btn--sm" id="mealClear">초기화</button></div>';
    mealDays.forEach(function (d) {
      h += '<div class="meal-day">';
      if (d.date) h += '<div class="meal-day__date">' + esc(d.date + (d.dow ? " " + d.dow : "")) + "</div>";
      h += '<div class="mini-grid">';
      d.meals.forEach(function (m) {
        var label = (d.date ? d.date + " " : "") + m.label;
        var cur = Math.min(cap, n(state.meals[label]));
        state.meals[label] = cur;
        h += "<div><label>" + esc(m.label) + "</label>" +
          stepper("meal::" + label, cur, cap) + "</div>";
      });
      h += "</div></div>";
    });
    return h;
  }
  function bindMeals(root) {
    bindSteppers(root);
    root.querySelector("#mealAll").addEventListener("click", function () {
      mealItems.forEach(function (m) { state.meals[m.label] = totalCount(); });
      refreshBody();
    });
    root.querySelector("#mealClear").addEventListener("click", function () {
      mealItems.forEach(function (m) { state.meals[m.label] = 0; });
      refreshBody();
    });
  }

  /* --------------------------------------------------------- 3-1) 숙박 */
  function renderLodging() {
    var cap = totalCount();
    var h = '<div class="inline-actions">' +
      '<button type="button" class="btn btn--ghost btn--sm" id="stayAll">전체 인원(' + cap + "명) 일괄 적용</button>" +
      '<button type="button" class="btn btn--ghost btn--sm" id="stayClear">초기화</button></div>';
    h += '<div class="mini-grid">';
    lodgeNights.forEach(function (b) {
      var cur = Math.min(cap, n(state.lodging[b.label]));
      state.lodging[b.label] = cur;
      h += "<div><label>" + esc(b.label) + "</label>" +
        stepper("stay::" + b.label, cur, cap) + "</div>";
    });
    h += "</div>";
    return h;
  }
  function bindLodging(root) {
    bindSteppers(root);
    root.querySelector("#stayAll").addEventListener("click", function () {
      lodgeNights.forEach(function (b) { state.lodging[b.label] = totalCount(); });
      refreshBody();
    });
    root.querySelector("#stayClear").addEventListener("click", function () {
      lodgeNights.forEach(function (b) { state.lodging[b.label] = 0; });
      refreshBody();
    });
  }

  /* --------------------------------------------------------- 4) 차량 */
  function renderTransport() {
    var h = '<div class="field"><label class="lbl">차량 이용</label>' +
      '<select id="f_tp"><option value="">선택 안 함</option>' +
      (tp.options || []).map(function (o) {
        return "<option" + (state.transport === o ? " selected" : "") + ">" + esc(o) + "</option>";
      }).join("") + "</select></div>";

    var showDep = tp.askDeparture && state.transport && state.transport !== "미정";
    h += '<div class="field" id="depField"' + (showDep ? "" : " hidden") + '>' +
      '<label class="lbl">출발지</label>';
    if (tp.departureOptions && tp.departureOptions.length) {
      h += '<select id="f_dep"><option value="">선택하세요</option>' +
        tp.departureOptions.map(function (o) {
          return "<option" + (state.departure === o ? " selected" : "") + ">" + esc(o) + "</option>";
        }).join("") + "</select>";
    } else {
      h += '<input type="text" id="f_dep" value="' + esc(state.departure) + '">';
    }
    h += "</div>";
    return h;
  }
  function bindTransport(root) {
    var sel = root.querySelector("#f_tp");
    var dep = root.querySelector("#depField");
    sel.addEventListener("change", function () {
      state.transport = sel.value;
      dep.hidden = !(tp.askDeparture && sel.value && sel.value !== "미정");
    });
    var d = root.querySelector("#f_dep");
    if (d) d.addEventListener(d.tagName === "SELECT" ? "change" : "input", function () {
      state.departure = d.value;
    });
  }

  /* --------------------------------------------------------- 5) 기타 */
  function renderNotes() {
    return '<div class="field"><label class="lbl">' + esc(CFG.notesLabel || "기타 요청사항") + "</label>" +
      '<textarea id="f_notes">' + esc(state.notes) + "</textarea></div>";
  }
  function bindNotes(root) {
    var t = root.querySelector("#f_notes");
    t.addEventListener("input", function () { state.notes = t.value; });
  }

  /* --------------------------------------------------------- 6) 확인 */
  function renderReview() {
    var c = companionCount();
    var mealPairs = mealItems
      .map(function (m) { return [m.label, n(state.meals[m.label])]; })
      .filter(function (p) { return p[1] > 0; });
    var stayPairs = lodgeNights
      .map(function (b) { return [b.label, n(state.lodging[b.label])]; })
      .filter(function (p) { return p[1] > 0; });

    var rows = [
      ["이름", state.name],
      ["참석 인원", "총 " + totalCount() + "명" + (c > 0 ? " (본인 + 동반 " + c + "명)" : " (본인)")],
    ];
    if (c > 0)
      rows.push(["동반자 이름", state.names.slice(0, c).map(function (s) { return (s || "").trim() || "(미입력)"; }).join("\n")]);
    rows.push(["참석 일정", state.scheds.map(labelOf).join("\n") || "-"]);
    if (meals.enabled)
      rows.push(["식사", mealPairs.length
        ? mealPairs.map(function (p) { return p[0] + " " + p[1] + "명"; }).join("\n")
        : "신청 안 함"]);
    if (lodge.enabled)
      rows.push(["숙박", stayPairs.length
        ? stayPairs.map(function (p) { return p[0] + " " + p[1] + "명"; }).join("\n")
        : "신청 안 함"]);
    if (tp.enabled)
      rows.push(["차량", (state.transport || "선택 안 함") +
        (state.departure ? " / " + state.departure : "")]);
    if (CFG.showNotes)
      rows.push(["기타", state.notes.trim() || "-"]);

    return (PREVIEW ? '<div class="ribbon">미리보기 모드 — 제출해도 저장되지 않습니다.</div>' : "") +
      '<dl class="review">' +
      rows.map(function (r) {
        return '<div class="review__item"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1] || "-") + "</dd></div>";
      }).join("") +
      "</dl>";
  }

  /* --------------------------------------------------------- 제출 */
  function submit() {
    var btn = $("nextBtn");
    btn.disabled = true;
    btn.textContent = "전송 중...";

    var mealPairs = [];
    var mealTotal = 0;
    mealItems.forEach(function (m) {
      var v = n(state.meals[m.label]);
      if (v > 0) { mealPairs.push(m.label + ":" + v); mealTotal += v; }
    });

    var stayPairs = [];
    var lodgingTotal = 0;
    lodgeNights.forEach(function (b) {
      var v = n(state.lodging[b.label]);
      if (v > 0) { stayPairs.push(b.label + ":" + v); lodgingTotal += v; }
    });

    var payload = {
      name: state.name.trim(),
      adults: comp.askAdultChild ? n(state.adults) : "",
      kids: comp.askAdultChild ? n(state.kids) : "",
      companions: companionCount(),
      companionNames: state.names.slice(0, companionCount())
        .map(function (s) { return (s || "").trim(); }).filter(Boolean).join(", "),
      totalCount: totalCount(),
      schedules: state.scheds.map(labelOf).join(", "),
      scheduleIds: state.scheds.join(","),
      meals: mealPairs.join(", "),
      mealTotal: mealTotal,
      lodging: stayPairs.join(", "),
      lodgingTotal: lodgingTotal,
      transport: tp.enabled ? state.transport : "",
      departure: tp.enabled ? state.departure : "",
      notes: CFG.showNotes ? state.notes.trim() : "",
      submittedAt: new Date().toISOString(),
    };

    if (PREVIEW) { setTimeout(function () { done(payload, true); }, 450); return; }

    fetch(CFG.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "add", data: payload }),
    })
      .then(function (r) { return r.json().catch(function () { return { ok: true }; }); })
      .then(function (res) {
        if (res && res.ok === false) throw new Error(res.error || "server");
        done(payload, false);
      })
      .catch(function (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = "제출하기";
        showMsg("전송에 실패했습니다. 네트워크를 확인하고 다시 시도해 주세요. (" + err.message + ")");
      });
  }

  function done(payload, preview) {
    $("progressBar").style.width = "100%";
    $("nav").hidden = true;
    $("stage").innerHTML =
      '<div class="done">' +
        '<div class="ico">' + (preview ? "👀" : "✅") + "</div>" +
        "<h2>" + (preview ? "미리보기 — 저장되지 않았습니다" : "접수가 완료되었습니다") + "</h2>" +
        "<p>" + esc(payload.name) + " 님, 총 " + payload.totalCount + "명<br>" +
          esc(payload.schedules) + "</p>" +
        '<button type="button" class="btn btn--ghost" id="againBtn" style="margin-top:18px">다른 사람 추가 접수</button>' +
      "</div>";
    $("againBtn").addEventListener("click", function () { location.reload(); });
  }

  /* --------------------------------------------------------- 공통 위젯 */
  function stepper(key, val, max) {
    var hasMax = typeof max === "number" && isFinite(max);
    return '<div class="stepper" data-key="' + esc(key) + '"' +
      (hasMax ? ' data-max="' + max + '"' : "") + ">" +
      '<button type="button" data-d="-1" aria-label="빼기">−</button>' +
      '<input type="number" min="0"' + (hasMax ? ' max="' + max + '"' : "") +
      ' inputmode="numeric" value="' + n(val) + '">' +
      '<button type="button" data-d="1" aria-label="더하기">+</button>' +
      "</div>";
  }
  function bindSteppers(root) {
    root.querySelectorAll(".stepper").forEach(function (st) {
      var key = st.getAttribute("data-key");
      var input = st.querySelector("input");
      var max = st.hasAttribute("data-max") ? parseInt(st.getAttribute("data-max"), 10) : Infinity;
      function commit(v) {
        v = Math.max(0, parseInt(v, 10) || 0);
        if (isFinite(max)) v = Math.min(max, v);
        input.value = v;
        setModel(key, v);
        refreshTotalLine();
        syncCompanionNames();
      }
      st.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          commit((parseInt(input.value, 10) || 0) + parseInt(b.getAttribute("data-d"), 10));
        });
      });
      input.addEventListener("input", function () {
        if (input.value === "") { setModel(key, 0); refreshTotalLine(); syncCompanionNames(); return; }
        commit(input.value);
      });
    });
  }
  function setModel(key, v) {
    if (key.indexOf("meal::") === 0) state.meals[key.slice(6)] = v;
    else if (key.indexOf("stay::") === 0) state.lodging[key.slice(6)] = v;
    else state[key] = v;
  }
  function bindText(root, elId, key) {
    var el = root.querySelector("#" + elId);
    el.addEventListener("input", function () { state[key] = el.value; });
  }

  /* --------------------------------------------------------- 유틸 */
  function n(v) { var x = parseInt(v, 10); return isNaN(x) || x < 0 ? 0 : x; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function showMsg(m) {
    var el = $("stepMsg");
    if (el) { el.className = "msg err"; el.textContent = m; }
  }

  /* --------------------------------------------------- 글씨 크기 조절 */
  var FS_LEVELS = [0.88, 1, 1.12, 1.28, 1.45];
  var fsIdx = 4; // 처음 열릴 때 기본 배율 = 5단계(1.45x)
  try {
    var stored = localStorage.getItem("mtg_fs");
    if (stored !== null) fsIdx = Math.min(FS_LEVELS.length - 1, Math.max(0, parseInt(stored, 10) || 0));
  } catch (e) {}
  function applyFs() {
    $("app").style.setProperty("--fs", FS_LEVELS[fsIdx] + "rem");
    $("fsDown").disabled = fsIdx === 0;
    $("fsUp").disabled = fsIdx === FS_LEVELS.length - 1;
    try { localStorage.setItem("mtg_fs", String(fsIdx)); } catch (e) {}
  }
  $("fsDown").addEventListener("click", function () { fsIdx = Math.max(0, fsIdx - 1); applyFs(); });
  $("fsUp").addEventListener("click", function () { fsIdx = Math.min(FS_LEVELS.length - 1, fsIdx + 1); applyFs(); });
  $("fsReset").addEventListener("click", function () { fsIdx = 1; applyFs(); });
  applyFs();

  /* --------------------------------------------------------- 초기화 */
  document.title = (CFG.eventTitle || "집회") + " 참가 접수";
  $("prevBtn").addEventListener("click", function () { go(-1); });
  $("nextBtn").addEventListener("click", function () { go(1); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "BUTTON")) return;
    if ($("nav").hidden) {
      var sb = $("startBtn");
      if (sb) { e.preventDefault(); sb.click(); }
      return;
    }
    e.preventDefault();
    $("nextBtn").click();
  });
  render();
})();
