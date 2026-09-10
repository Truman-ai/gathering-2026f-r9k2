/* 집회 참가 접수 - 관리자 현황 (단계형)
 * 1 종합 대시보드 · 2 참석 일정 · 3 식사 · 4 숙박 · 5 차량 · 6 기타 요청사항 · 7 접수 내역
 */
(function () {
  "use strict";

  var CFG = window.APP_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var PREVIEW = !CFG.scriptUrl;

  /* 마지막 "접수 내역" 표의 열 정의 */
  var COLS = [
    { key: "submittedAt", label: "접수시각", fmt: fmtTime },
    { key: "name", label: "이름" },
    { key: "totalCount", label: "총원" },
    { key: "adults", label: "성인" },
    { key: "kids", label: "어린이" },
    { key: "companionNames", label: "동반자", wrap: true },
    { key: "schedules", label: "참석 일정", wrap: true },
    { key: "meals", label: "식사", wrap: true },
    { key: "mealTotal", label: "식사계" },
    { key: "lodging", label: "숙박", wrap: true },
    { key: "lodgingTotal", label: "숙박계" },
    { key: "transport", label: "차량" },
    { key: "departure", label: "출발지" },
    { key: "notes", label: "기타", wrap: true },
  ];

  var rows = [];

  document.title = (CFG.eventTitle || "집회") + " 접수 현황";
  $("dashTitle").textContent = (CFG.eventTitle || "집회") + " 접수 현황";
  $("dashSub").textContent = CFG.eventPeriod || "";

  /* -------------------------------------------------- 페이지 정의 */
  var pages = [{ id: "dash", title: "종합 대시보드", render: renderDash }];
  if ((CFG.schedules || []).length)
    pages.push({ id: "sched", title: "참석 일정", render: renderSched });
  if (CFG.meals && CFG.meals.enabled)
    pages.push({ id: "meal", title: "식사 신청", render: renderMeal });
  if (CFG.lodging && CFG.lodging.enabled)
    pages.push({ id: "stay", title: "숙박 신청", render: renderStay });
  if (CFG.transport && CFG.transport.enabled)
    pages.push({ id: "bus", title: "차량 운행", render: renderBus });
  if (CFG.showNotes)
    pages.push({ id: "note", title: "기타 요청사항", render: renderNote });
  pages.push({ id: "list", title: "접수 내역", render: renderList, bind: bindList });

  var pageIdx = 0;

  /* -------------------------------------------------- 암호 게이트 */
  var adminPass = "";
  try {
    var savedPass = sessionStorage.getItem("mtg_admin_pass");
    if (savedPass) { adminPass = savedPass; openDash(); }
  } catch (e) {}

  $("enterBtn").addEventListener("click", tryEnter);
  $("pass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryEnter(); });

  function tryEnter() {
    var v = $("pass").value.trim();
    if (!v) { gateError("암호를 입력하세요."); return; }
    adminPass = v;
    $("gateMsg").className = "msg";
    openDash();
  }

  function gateError(msg) {
    $("dashView").hidden = true;
    $("gateView").hidden = false;
    var m = $("gateMsg");
    m.className = "msg err";
    m.textContent = msg;
  }

  function openDash() {
    $("gateView").hidden = true;
    $("dashView").hidden = false;

    var sl = $("sheetLink");
    sl.innerHTML = "";
    if (CFG.sheetUrl) {
      var a = document.createElement("a");
      a.href = CFG.sheetUrl; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Google 스프레드시트 열기 ↗";
      sl.appendChild(a);
    } else {
      sl.textContent = "원본 데이터는 연결된 Google 스프레드시트에서도 확인할 수 있습니다.";
    }

    renderPage();
    load();
  }

  $("refreshBtn").addEventListener("click", load);
  $("prevBtn").addEventListener("click", function () { goPage(-1); });
  $("nextBtn").addEventListener("click", function () { goPage(1); });

  /* -------------------------------------------------- 페이지 전환 */
  function goPage(d) {
    pageIdx = Math.max(0, Math.min(pages.length - 1, pageIdx + d));
    renderPage();
  }

  function renderPage() {
    var p = pages[pageIdx];
    $("pageTitle").textContent = (pageIdx + 1) + ". " + p.title;
    $("navMeta").textContent = (pageIdx + 1) + " / " + pages.length;
    $("progressBar").style.width =
      (pages.length > 1 ? pageIdx / (pages.length - 1) * 100 : 100) + "%";
    $("prevBtn").classList.toggle("is-hidden", pageIdx === 0);
    $("nextBtn").classList.toggle("is-hidden", pageIdx === pages.length - 1);

    var stage = $("admStage");
    stage.innerHTML = p.render();
    if (p.bind) p.bind();
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  /* -------------------------------------------------- 데이터 로드 (JSONP) */
  function load() {
    $("spin").hidden = false;
    $("spin").textContent = "불러오는 중...";

    if (PREVIEW) {
      $("spin").innerHTML =
        "미리보기 모드입니다. <code>assets/config.js</code> 의 <code>scriptUrl</code> 을 " +
        "설정하면 실제 접수 내역이 표시됩니다.";
      rows = [];
      renderPage();
      return;
    }

    var cb = "mtgcb_" + Date.now();
    var timer = setTimeout(function () {
      cleanup();
      $("spin").hidden = false;
      $("spin").textContent = "불러오기 실패 - URL/배포 상태를 확인하세요.";
    }, 15000);

    window[cb] = function (res) {
      clearTimeout(timer);
      cleanup();
      if (res && res.ok === false && res.error === "unauthorized") {
        try { sessionStorage.removeItem("mtg_admin_pass"); } catch (e) {}
        adminPass = "";
        gateError("암호가 올바르지 않습니다.");
        return;
      }
      if (!res || res.ok === false) {
        $("spin").hidden = false;
        $("spin").textContent = "오류: " + ((res && res.error) || "unknown");
        return;
      }
      try { sessionStorage.setItem("mtg_admin_pass", adminPass); } catch (e) {}
      rows = res.rows || [];
      $("spin").hidden = true;
      renderPage();
    };

    function cleanup() {
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    var url = CFG.scriptUrl +
      (CFG.scriptUrl.indexOf("?") >= 0 ? "&" : "?") +
      "action=list&pass=" + encodeURIComponent(adminPass) +
      "&callback=" + cb + "&_=" + Date.now();
    var s = document.createElement("script");
    s.src = url;
    s.onerror = function () {
      clearTimeout(timer); cleanup();
      $("spin").hidden = false; $("spin").textContent = "네트워크 오류";
    };
    document.body.appendChild(s);
  }

  /* ================================================== 1) 종합 대시보드 */
  function computeStats(list) {
    var stat = { count: list.length, people: 0, meals: 0, stayCases: 0, bus: 0 };
    list.forEach(function (r) {
      stat.people += toInt(r.totalCount);
      stat.meals += toInt(r.mealTotal);
      if (toInt(r.lodgingTotal) > 0) stat.stayCases += 1;
      if (/탑승/.test(r.transport || "")) stat.bus += toInt(r.totalCount);
    });
    return stat;
  }

  function renderDash() {
    var s = computeStats(rows);
    return '<div class="stat-row">' + [
      statCard("접수 건수", s.count + " 건"),
      statCard("총 참석 인원", s.people + " 명"),
      statCard("식사 신청(끼니 계)", s.meals + " 회"),
      statCard("숙박 신청", s.stayCases + " 건"),
      statCard("차량 운행 필요 인원", s.bus + " 명"),
    ].join("") + "</div>";
  }

  /* ================================================== 2) 참석 일정 */
  function renderSched() {
    var scheds = CFG.schedules || [];
    if (!scheds.length) return emptyBox("참석 일정 설정이 없습니다.");
    var total = 0;
    var body = scheds.map(function (sc) {
      var ppl = 0;
      rows.forEach(function (r) {
        var ids = String(r.scheduleIds || "").split(",").map(trim).filter(Boolean);
        var hit = ids.indexOf(sc.id) >= 0 || String(r.schedules || "").indexOf(sc.label) >= 0;
        if (hit) ppl += toInt(r.totalCount);
      });
      total += ppl;
      return row2(sc.label, ppl + " 명");
    }).join("");
    return rptTable(["세션", "참석 인원"], body, row2("합계 (연인원)", total + " 명"));
  }

  /* ================================================== 3) 식사 신청 */
  function mealLabelList() {
    var m = CFG.meals || {};
    if (m.days && m.days.length) {
      var out = [];
      m.days.forEach(function (d) {
        (d.meals || []).forEach(function (x) {
          out.push((d.date ? d.date + " " : "") + x.label);
        });
      });
      return out;
    }
    if (m.items && m.items.length) return m.items.map(function (x) { return x.label; });
    return [];
  }

  function renderMeal() {
    var labels = mealLabelList();
    if (!labels.length) return emptyBox("식사 설정이 없습니다.");
    var map = {}, order = labels.slice();
    labels.forEach(function (l) { map[l] = 0; });
    rows.forEach(function (r) {
      parsePairs(r.meals).forEach(function (p) {
        if (!(p[0] in map)) { map[p[0]] = 0; order.push(p[0]); }
        map[p[0]] += p[1];
      });
    });
    var total = 0;
    var body = order.map(function (l) { total += map[l]; return row2(l, map[l] + " 명"); }).join("");
    return rptTable(["끼니", "신청 인원"], body, row2("합계 (끼니 계)", total + " 명"));
  }

  /* ================================================== 4) 숙박 신청 */
  function renderStay() {
    var nights = (CFG.lodging && CFG.lodging.nights) || [];
    if (!nights.length) return emptyBox("숙박 설정이 없습니다.");
    var map = {}, order = [];
    nights.forEach(function (b) { map[b.label] = 0; order.push(b.label); });
    rows.forEach(function (r) {
      parsePairs(r.lodging).forEach(function (p) {
        if (!(p[0] in map)) { map[p[0]] = 0; order.push(p[0]); }
        map[p[0]] += p[1];
      });
    });
    var total = 0;
    var body = order.map(function (l) { total += map[l]; return row2(l, map[l] + " 명"); }).join("");
    return rptTable(["날짜 (밤)", "숙박 인원"], body, row2("합계 (연박)", total + " 명"));
  }

  /* ================================================== 5) 차량 운행 */
  function renderBus() {
    var list = rows.filter(function (r) { return /탑승/.test(r.transport || ""); });
    var total = 0;
    list.forEach(function (r) { total += toInt(r.totalCount); });

    var head =
      '<p class="big-num">차량 이용 인원 ' + total + ' 명</p>' +
      '<p class="sub-note">양평역 · 양평 버스터미널 탑승 선택자 (신청자 + 동반자 합산)</p>';

    if (!list.length) return head + emptyBox("차량 이용 신청자가 없습니다.");

    var bodyRows = list.map(function (r) {
      return "<tr><td>" + esc(r.name || "") + "</td>" +
        "<td>" + esc((r.companionNames || "").trim() || "-") + "</td>" +
        '<td class="num">' + toInt(r.totalCount) + " 명</td></tr>";
    }).join("");
    var foot = '<tr><td colspan="2">합계</td><td class="num">' + total + " 명</td></tr>";
    return head + rptTableRaw(["신청자", "동반자", "인원"], bodyRows, foot);
  }

  /* ================================================== 6) 기타 요청사항 */
  function renderNote() {
    var list = rows.filter(function (r) { return (r.notes || "").trim(); });
    if (!list.length) return emptyBox("기타 요청사항이 없습니다.");
    var bodyRows = list.map(function (r) {
      return "<tr><td>" + esc(r.name || "") + "</td>" +
        '<td class="pre">' + esc((r.notes || "").trim()) + "</td></tr>";
    }).join("");
    return rptTableRaw(["신청자", "요청사항"], bodyRows, "");
  }

  /* ================================================== 7) 접수 내역 */
  function renderList() {
    return "" +
      '<div class="toolbar">' +
        '<select id="schedFilter"><option value="">전체 일정</option></select>' +
        '<input type="text" id="search" placeholder="이름 / 동반자 검색" style="max-width:240px" />' +
        '<span class="sp"></span>' +
        '<button type="button" class="btn" id="csvBtn">CSV 내보내기</button>' +
      "</div>" +
      '<div class="table-scroll">' +
        '<table id="tbl"><thead id="thead"></thead><tbody id="tbody"></tbody></table>' +
        '<div class="empty" id="emptyMsg" hidden>접수된 내역이 없습니다.</div>' +
      "</div>";
  }

  function bindList() {
    var sel = $("schedFilter");
    (CFG.schedules || []).forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.label; o.textContent = s.label;
      sel.appendChild(o);
    });
    $("csvBtn").addEventListener("click", exportCsv);
    sel.addEventListener("change", renderTable);
    $("search").addEventListener("input", renderTable);
    renderTable();
  }

  function renderTable() {
    var list = filtered();
    $("thead").innerHTML = "<tr>" + COLS.map(function (c) {
      return "<th>" + esc(c.label) + "</th>";
    }).join("") + "</tr>";

    if (!list.length) {
      $("tbl").hidden = true;
      $("emptyMsg").hidden = false;
      return;
    }
    $("tbody").innerHTML = list.map(function (r) {
      return "<tr>" + COLS.map(function (c) {
        var v = c.fmt ? c.fmt(r[c.key]) : (r[c.key] == null ? "" : r[c.key]);
        return '<td class="' + (c.wrap ? "wrap-cell" : "") + '">' + esc(v) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    $("emptyMsg").hidden = true;
    $("tbl").hidden = false;
  }

  function filtered() {
    var sf = ($("schedFilter") || {}).value || "";
    var q = (($("search") || {}).value || "").trim().toLowerCase();
    return rows.filter(function (r) {
      if (sf && (r.schedules || "").indexOf(sf) < 0) return false;
      if (q) {
        var hay = ((r.name || "") + " " + (r.companionNames || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) {
      return String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""));
    });
  }

  /* ---------- CSV ---------- */
  function exportCsv() {
    var list = filtered();
    if (!list.length) return;
    var head = COLS.map(function (c) { return c.label; });
    var lines = [head.join(",")];
    list.forEach(function (r) {
      lines.push(COLS.map(function (c) {
        var v = c.fmt ? c.fmt(r[c.key]) : (r[c.key] == null ? "" : r[c.key]);
        v = String(v).replace(/"/g, '""');
        return /[",\n]/.test(v) ? '"' + v + '"' : v;
      }).join(","));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "접수현황_" + ymd(new Date()) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------- 표 빌더 ---------- */
  function row2(a, b) {
    return "<tr><td>" + esc(a) + '</td><td class="num">' + esc(b) + "</td></tr>";
  }
  function rptTable(heads, bodyHtml, footHtml) {
    return rptTableRaw(heads, bodyHtml, footHtml);
  }
  function rptTableRaw(heads, bodyHtml, footHtml) {
    return '<div class="rpt-wrap"><table class="rpt">' +
      "<thead><tr>" + heads.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead>" +
      "<tbody>" + bodyHtml + "</tbody>" +
      (footHtml ? "<tfoot>" + footHtml + "</tfoot>" : "") +
      "</table></div>";
  }
  function emptyBox(msg) {
    return '<div class="empty">' + esc(msg) + "</div>";
  }
  function statCard(k, v) {
    return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + "</div></div>";
  }

  /* ---------- helpers ---------- */
  function toInt(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function trim(s) { return String(s == null ? "" : s).trim(); }
  /* "라벨:2, 라벨:3" -> [["라벨",2],["라벨",3]] */
  function parsePairs(str) {
    return String(str || "").split(",").map(function (seg) {
      seg = seg.trim();
      if (!seg) return null;
      var i = seg.lastIndexOf(":");
      if (i < 0) return null;
      return [seg.slice(0, i).trim(), toInt(seg.slice(i + 1))];
    }).filter(Boolean);
  }
  function fmtTime(v) {
    if (!v) return "";
    var d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) +
      " " + p2(d.getHours()) + ":" + p2(d.getMinutes());
  }
  function ymd(d) { return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()); }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
