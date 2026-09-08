/**
 * 金鶯問題回報 - 入口網「有新回覆」提醒外掛
 * ================================================
 * 用法：把本檔放到入口網（drking）repo 根目錄，
 * 然後在 index.html 的 </body> 前加一行：
 *   <script src="report-badge.js"></script>
 *
 * 原理：入口網與回報頁同屬 jason19820913-lab.github.io，共用 localStorage。
 * 員工登入入口網後，本外掛用他的員編去回報系統查「我的回報」，
 * 若有尚未看過的回覆（回覆時間 ≠ 已讀紀錄），右下角浮出提醒；點了就開回報頁的「我的回報」。
 * 沒有新回覆時完全不顯示。
 */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbzH52RfuQaSbx1iyMbTHSIqC2ydsJPDz6SsWIYSCqpgVo9oCOymLu7B3JmSteprsYk/exec';
  var REPORT_URL = 'https://jason19820913-lab.github.io/reporting/?tab=mine';
  var USER_KEY = 'eliteClinicPortalUser';
  var READ_KEY = 'issueReadReplies';
  var REFRESH_MS = 120000; // 每 2 分鐘更新一次

  function getUser() {
    try { var u = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); return u && u.empId ? u : null; }
    catch (e) { return null; }
  }
  function getReadMap() {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch (e) { return {}; }
  }

  var style = document.createElement('style');
  style.textContent =
    '@keyframes irPulse{0%{box-shadow:0 6px 20px rgba(27,118,120,.45)}50%{box-shadow:0 6px 28px rgba(27,118,120,.85)}100%{box-shadow:0 6px 20px rgba(27,118,120,.45)}}' +
    '#ir-badge{position:fixed;right:18px;bottom:76px;z-index:99998;display:none;align-items:center;gap:8px;' +
    'background:#1B7678;color:#fff;font:700 14px/1.2 "PingFang TC","Microsoft JhengHei",sans-serif;' +
    'padding:13px 20px;border-radius:32px;text-decoration:none;cursor:pointer;' +
    'animation:irPulse 2s infinite;transition:transform .15s}' +
    '#ir-badge:hover{transform:scale(1.05)}' +
    '#ir-badge .ir-n{background:#fff;color:#1B7678;border-radius:20px;padding:2px 9px;font-size:15px;font-weight:800}';
  document.head.appendChild(style);

  var box = document.createElement('a');
  box.id = 'ir-badge';
  box.href = REPORT_URL;
  document.body.appendChild(box);

  function refresh() {
    var u = getUser();
    if (!u) { box.style.display = 'none'; return; }
    fetch(API + '?action=getMyIssues&empId=' + encodeURIComponent(u.empId))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success) { box.style.display = 'none'; return; }
        var read = getReadMap();
        var n = (res.issues || []).filter(function (it) { return it.reply && read[it.id] !== it.replyTime; }).length;
        if (n > 0) {
          box.innerHTML = '💬 問題回報有新回覆 <span class="ir-n">' + n + '</span>';
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      })
      .catch(function () { box.style.display = 'none'; });
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
