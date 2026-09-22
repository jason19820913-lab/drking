/**
 * 金鶯交班系統 - 入口網提醒紅點外掛
 * ================================================
 * 用法：把本檔放到入口網（drking）repo 根目錄，
 * 然後在 index.html 的 </body> 前加一行：
 *   <script src="handover-badge.js"></script>
 *
 * 原理：入口網與交班系統同屬 jason19820913-lab.github.io，
 * 共用同一網域的 localStorage。員工只要在同一瀏覽器登入過
 * 交班系統，入口網就能識別身分並查詢待簽收數量。
 * 沒登入過或沒有待簽收時，完全不顯示、不干擾版面。
 */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbyehaxZzExQI6VcpZgR0dI3joTuHg8L7uUOmQtfa_OrH_rOq2KjOwkKHHm3YR3SGHkncA/exec';
  var HANDOVER_URL = 'https://jason19820913-lab.github.io/handover/';
  var REFRESH_MS = 60000; // 每 60 秒自動更新一次

  function getUser() {
    try {
      var d = JSON.parse(localStorage.getItem('ho_user_v2') || 'null');
      return d && d.user && d.user.empId ? d.user : null;
    } catch (e) { return null; }
  }

  // 樣式（含呼吸動畫）
  var style = document.createElement('style');
  style.textContent = '@keyframes hoPulse{0%{box-shadow:0 6px 20px rgba(217,119,6,.45)}50%{box-shadow:0 6px 28px rgba(217,119,6,.85)}100%{box-shadow:0 6px 20px rgba(217,119,6,.45)}}' +
    '#ho-badge{position:fixed;right:18px;bottom:18px;z-index:99999;display:none;align-items:center;gap:8px;' +
    'background:#d97706;color:#fff;font:700 14px/1.2 "PingFang TC","Microsoft JhengHei",sans-serif;' +
    'padding:13px 20px;border-radius:32px;text-decoration:none;cursor:pointer;' +
    'animation:hoPulse 2s infinite;transition:transform .15s}' +
    '#ho-badge:hover{transform:scale(1.05)}' +
    '#ho-badge .ho-n{background:#fff;color:#b45309;border-radius:20px;padding:2px 9px;font-size:15px;font-weight:800}';
  document.head.appendChild(style);

  var box = document.createElement('a');
  box.id = 'ho-badge';
  box.href = HANDOVER_URL;
  document.body.appendChild(box);

  function refresh() {
    var u = getUser();
    if (!u) { box.style.display = 'none'; return; }
    var q = 'action=getHandovers&mode=inbox' +
      '&empId=' + encodeURIComponent(u.empId) +
      '&clinic=' + encodeURIComponent(u.clinic) +
      '&group=' + encodeURIComponent(u.group) +
      '&limit=100';
    fetch(API + '?' + q)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || res.error) { box.style.display = 'none'; return; }
        var n = (res.records || []).filter(function (r) {
          return r.status !== '已簽收' && r.status !== '已完成';
        }).length;
        if (n > 0) {
          box.innerHTML = '📥 交班待簽收 <span class="ho-n">' + n + '</span>';
          box.style.display = 'flex';
        } else {
          box.style.display = 'none';
        }
      })
      .catch(function () { box.style.display = 'none'; });
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
  // 同瀏覽器其他分頁登入/登出交班系統時即時同步
  window.addEventListener('storage', function (e) {
    if (!e || !e.key || e.key === 'ho_user_v2') refresh();
  });
})();
