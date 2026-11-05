document.addEventListener('DOMContentLoaded', () => {
  dashhq.network.canonicalize();
  document.querySelectorAll('a[data-family]').forEach(link => {
    link.href = dashhq.href(link.dataset.family, link.dataset.path || '/',
      link.dataset.network ? { network: link.dataset.network } : undefined);
  });
});
