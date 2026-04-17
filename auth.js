/* Simple client-side password gate.
   NOTE: This is NOT real security — anyone can view source.
   For a public-facing confidential deployment, put the site behind
   Vercel's password protection or a proper auth proxy.               */
(function () {
  'use strict';
  var KEY = 'utb_boardpack_auth';
  var EXPECTED = 'V29vZGh1cnN0';   // base64("Woodhurst")

  if (sessionStorage.getItem(KEY) === 'ok') return;

  // Hide page content until authenticated
  var hideStyle = document.createElement('style');
  hideStyle.id = 'pw-hide';
  hideStyle.textContent = 'body > *:not(#pw-overlay){visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(hideStyle);

  function showGate() {
    var overlay = document.createElement('div');
    overlay.id = 'pw-overlay';
    overlay.innerHTML =
      '<style>' +
      '#pw-overlay{position:fixed;inset:0;background:#FFFFFF;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Inter,system-ui,sans-serif;visibility:visible;min-width:0}' +
      '#pw-form{background:#FAFAFA;padding:48px 40px;border-radius:12px;border:1px solid #E5E7EB;box-shadow:0 8px 32px rgba(0,0,0,0.06);text-align:center;min-width:380px;border-top:4px solid #E5B821}' +
      '#pw-form img{height:64px;width:auto;margin:0 auto 24px;display:block}' +
      '#pw-title{font-weight:800;font-size:1.125rem;color:#0A0A0A;margin-bottom:6px;letter-spacing:-0.01em}' +
      '#pw-sub{font-size:0.75rem;color:#6B7280;margin-bottom:28px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700}' +
      '#pw-input{width:100%;padding:12px 16px;font-size:0.9375rem;border:1px solid #E5E7EB;border-radius:8px;font-family:inherit;outline:none;margin-bottom:16px;box-sizing:border-box;background:#fff;color:#0A0A0A}' +
      '#pw-input:focus{border-color:#E5B821;box-shadow:0 0 0 3px rgba(229,184,33,0.15)}' +
      '#pw-btn{width:100%;padding:12px;background:#E5B821;color:#0A0A0A;border:1px solid #E5B821;border-radius:999px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;cursor:pointer;font-family:inherit;transition:all 0.15s}' +
      '#pw-btn:hover{background:#0A0A0A;color:#E5B821;border-color:#0A0A0A}' +
      '#pw-err{color:#C0392B;font-size:0.75rem;margin-top:12px;min-height:1.2em;font-weight:600}' +
      '</style>' +
      '<form id="pw-form" autocomplete="off">' +
      '  <img src="assets/utb-mark.png" alt="">' +
      '  <div id="pw-title">Board Analytics Pack</div>' +
      '  <div id="pw-sub">Confidential &middot; Enter password</div>' +
      '  <input id="pw-input" type="password" autofocus placeholder="Password" autocomplete="off">' +
      '  <button id="pw-btn" type="submit">Unlock</button>' +
      '  <div id="pw-err">&nbsp;</div>' +
      '</form>';
    document.body.appendChild(overlay);

    var form = document.getElementById('pw-form');
    var input = document.getElementById('pw-input');
    var err = document.getElementById('pw-err');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        if (btoa(input.value) === EXPECTED) {
          sessionStorage.setItem(KEY, 'ok');
          overlay.remove();
          var s = document.getElementById('pw-hide');
          if (s) s.remove();
          return;
        }
      } catch (_) { /* fallthrough */ }
      err.textContent = 'Incorrect password';
      input.value = '';
      input.focus();
    });

    input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showGate);
  } else {
    showGate();
  }
})();
