// Demo-only behaviour for app.html: open and close the sign-in dialog, and show <dashhq-signin-help> following the
// app's own "keep my key" switch. ?signin opens the dialog on load (for renders).
const dialog = document.getElementById('signin');
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open="signin"]')) dialog.showModal();
  if (e.target.closest('[data-close]')) dialog.close();
});
document.getElementById('keep').addEventListener('change', (e) => {
  dialog.querySelector('dashhq-signin-help').setAttribute('kept', e.target.checked ? 'browser' : 'tab');
});
document.getElementById('signin-form').addEventListener('submit', (e) => e.preventDefault());
if (new URLSearchParams(location.search).has('signin')) dialog.showModal();
