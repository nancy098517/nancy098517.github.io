(() => {
  // Paste the deployed Google Apps Script /exec URL here.
  const webAppUrl = '';
  const launcher = document.querySelector('#nancy-chat-launcher');
  const panel = document.querySelector('#nancy-chat-panel');
  const close = panel.querySelector('button');
  const frame = panel.querySelector('iframe');

  function setOpen(open) {
    if (open && !frame.hasAttribute('src')) {
      frame.src = webAppUrl || './nancy-chat/Chat.html';
    }
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    (open ? close : launcher).focus();
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
})();
