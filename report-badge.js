/**
 * 金鶯問題回報 - 入口網提醒外掛（新回覆 + 派案）
 * ================================================
 * 用法：把本檔放到入口網（drking）repo 根目錄，
 * 然後在 index.html 的 </body> 前加一行：
 *   <script src="report-badge.js"></script>
 *
 * 原理：入口網與回報頁同屬 jason19820913-lab.github.io，共用 localStorage。
 * 員工登入入口網後，本外掛用他的員編/姓名去回報系統查：
 *   1. 「我的回報」有沒有還沒看過的回覆   → 💬 問題回報有新回覆 N
 *   2. 「派給我的」有沒有未結案的案件     → 🛠 派案給你 N 件待處理
 * 點了分別開回報頁的對應分頁。沒有時完全不顯示。
 */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbzH52RfuQaSbx1iyMbTHSIqC2ydsJPDz6SsWIYSCqpgVo9oCOymLu7B3JmSteprsYk/exec';
  var REPORT_URL = 'https://jason19820913-lab.github.io/reporting/';
  var USER_KEY = 'eliteClinicPortalUser';
  var READ_KEY = 'issueReadReplies';
  var SEEN_KEY = 'issueAssignedSeen';
  var REFRESH_MS = 120000; // 每 2 分鐘更新一次

  function getUser() {
    try { var u = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); return u && u.empId ? u : null; }
    catch (e) { return null; }
  }
  function getMap(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }

  var style = document.createElement('style');
  style.textContent =
    '@keyframes irPulse{0%{box-shadow:0 6px 20px rgba(27,118,120,.45)}50%{box-shadow:0 6px 28px rgba(27,118,120,.85)}100%{box-shadow:0 6px 20px rgba(27,118,120,.45)}}' +
    '#ir-stack{position:fixed;right:18px;bottom:76px;z-index:99998;display:flex;flex-direction:column;align-items:flex-end;gap:10px}' +
    '.ir-badge{display:none;align-items:center;gap:8px;color:#fff;' +
    'font:700 14px/1.2 "PingFang TC","Microsoft JhengHei",sans-serif;padding:13px 20px;border-radius:32px;' +
    'text-decoration:none;cursor:pointer;animation:irPulse 2s infinite;transition:transform .15s}' +
    '.ir-badge:hover{transform:scale(1.05)}' +
    '#ir-reply{background:#1B7678}#ir-asg{background:#8E44AD;animation:none;box-shadow:0 6px 20px rgba(142,68,173,.45)}' +
    '.ir-badge .ir-n{background:#fff;border-radius:20px;padding:2px 9px;font-size:15px;font-weight:800}' +
    '#ir-reply .ir-n{color:#1B7678}#ir-asg .ir-n{color:#8E44AD}';
  document.head.appendChild(style);

  var stack = document.createElement('div'); stack.id = 'ir-stack';
  var reply = document.createElement('a'); reply.id = 'ir-reply'; reply.className = 'ir-badge'; reply.href = REPORT_URL + '?tab=mine';
  var asg = document.createElement('a'); asg.id = 'ir-asg'; asg.className = 'ir-badge'; asg.href = REPORT_URL + '?tab=assigned';
  stack.appendChild(asg); stack.appendChild(reply); document.body.appendChild(stack);

  function getJson(q) {
    return fetch(API + '?' + q).then(function (r) { return r.json(); }).catch(function () { return null; });
  }

  function refresh() {
    var u = getUser();
    if (!u) { reply.style.display = 'none'; asg.style.display = 'none'; return; }

    getJson('action=getMyIssues&empId=' + encodeURIComponent(u.empId)).then(function (res) {
      if (!res || !res.success) { reply.style.display = 'none'; return; }
      var read = getMap(READ_KEY);
      var n = (res.issues || []).filter(function (it) {
        var a = it.lastActivity || it.replyTime || '';
        return a && read[it.id] !== a;
      }).length;
      reply.innerHTML = '💬 問題回報有新回覆 <span class="ir-n">' + n + '</span>';
      reply.style.display = n > 0 ? 'flex' : 'none';
    });

    getJson('action=getAssignedIssues&empId=' + encodeURIComponent(u.empId) + '&name=' + encodeURIComponent(u.name || '')).then(function (res) {
      if (!res || !res.success) { asg.style.display = 'none'; return; }
      var seen = getMap(SEEN_KEY);
      var open = (res.issues || []).filter(function (it) { return it.status !== '已解決' && it.status !== '不處理'; });
      var fresh = open.filter(function (it) { return !seen[it.id]; }).length;
      if (open.length > 0) {
        asg.innerHTML = '🛠 派案給你 <span class="ir-n">' + open.length + '</span> 件待處理' + (fresh ? '（' + fresh + ' 件新）' : '');
        asg.style.display = 'flex';
        asg.style.animation = fresh ? 'irPulse 2s infinite' : 'none';
      } else {
        asg.style.display = 'none';
      }
    });
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', function (ev) { if (!ev.key || ev.key === READ_KEY || ev.key === SEEN_KEY || ev.key === USER_KEY) refresh(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
