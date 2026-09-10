/* 집회 참가 접수 - 관리자 현황 로직 */
(function () {
  "use strict";

  var CFG = window.APP_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var PREVIEW = !CFG.scriptUrl;

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

  /* ---------- 암호 게이트 (검증은 Apps Script 서버에서) ---------- */
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
    openDash(); // load() 가 서버로 암호를 검증하고, 틀리면 다시 게이트로 돌려보냄
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
    buildSchedFilter();
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
    load();
  }

  function buildSchedFilter() {
    var sel = $("schedFilter");
    sel.length = 1; // "전체 일정" 옵션만 남기고 초기화
    (CFG.schedules || []).forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.label; o.textContent = s.label;
      sel.appendChild(o);
    });
  }

  $("refreshBtn").addEventListener("click", load);
  $("csvBtn").addEventListener("click", exportCsv);
  $("schedFilter").addEventListener("change", render);
  $("search").addEventListener("input", render);

  /* ---------- 데이터 로드 (JSONP - CORS 회피) ---------- */
  function load() {
    $("spin").hidden = false;
    $("spin").textContent = "불러오는 중...";
    $("tbl").hidden = true;
    $("emptyMsg").hidden = true;

    if (PREVIEW) {
      $("spin").hidden = false;
      $("spin").innerHTML =
        "미리보기 모드입니다. <code>assets/config.js</code> 의 <code>scriptUrl</code> 을 " +
        "설정하면 실제 접수 내역이 표시됩니다.";
      rows = [];
      return;
    }

    var cb = "mtgcb_" + Date.now();
    var timer = setTimeout(function () {
      cleanup();
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
        $("spin").textContent = "오류: " + ((res && res.error) || "unknown");
        return;
      }
      try { sessionStorage.setItem("mtg_admin_pass", adminPass); } catch (e) {}
      rows = res.rows || [];
      render();
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
    s.onerror = function () { clearTimeout(timer); cleanup(); $("spin").textContent = "네트워크 오류"; };
    document.body.appendChild(s);
  }

  /* ---------- 렌더 ---------- */
  function render() {
    var list = filtered();

    // 통계
    var stat = { count: list.length, people: 0, meals: 0, stay: 0, bus: 0 };
    list.forEach(function (r) {
      stat.people += toInt(r.totalCount);
      stat.meals += toInt(r.mealTotal);
      stat.stay += toInt(r.lodgingTotal);
      if (/탑승/.test(r.transport || "")) stat.bus += toInt(r.totalCount);
    });
    $("statRow").innerHTML = [
      statCard("접수 건수", stat.count + " 건"),
      statCard("총 참석 인원", stat.people + " 명"),
      statCard("식사 신청(연인원)", stat.meals + " 명"),
      statCard("숙박 신청(연박)", stat.stay + " 명"),
      statCard("차량 탑승 예상", stat.bus + " 명"),
    ].join("");

    // 헤더
    $("thead").innerHTML = "<tr>" + COLS.map(function (c) {
      return "<th>" + esc(c.label) + "</th>";
    }).join("") + "</tr>";

    // 본문
    if (!list.length) {
      $("spin").hidden = true;
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

    $("spin").hidden = true;
    $("emptyMsg").hidden = true;
    $("tbl").hidden = false;
  }

  function filtered() {
    var sf = $("schedFilter").value;
    var q = $("search").value.trim().toLowerCase();
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

  function statCard(k, v) {
    return '<div class="stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + "</div></div>";
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

  /* ---------- helpers ---------- */
  function toInt(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
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
