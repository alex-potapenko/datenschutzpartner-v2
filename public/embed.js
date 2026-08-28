(function () {
  var script = document.currentScript;
  if (!script) return;

  var hostedUrl = script.getAttribute('data-hosted-url');
  var policyId = script.getAttribute('data-policy-id');
  var site = script.getAttribute('data-site');
  var origin = script.src.replace(/\/embed\.js(?:\?.*)?$/, '');

  function insertIframe(src) {
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Privacy Policy';
    iframe.width = '100%';
    iframe.height = '800';
    iframe.loading = 'lazy';
    iframe.style.border = '0';
    iframe.style.maxWidth = '100%';
    script.parentNode.insertBefore(iframe, script.nextSibling);
  }

  if (hostedUrl) {
    insertIframe(hostedUrl);
    return;
  }

  if (!policyId || !site) return;

  fetch(origin + '/api/hosted-policies/legacy/' + encodeURIComponent(policyId) + '/' + encodeURIComponent(site))
    .then(function (response) {
      if (!response.ok) throw new Error('Policy not found');
      return response.json();
    })
    .then(function (payload) {
      insertIframe(origin + payload.path);
    })
    .catch(function () {
      /* Silent fail in embed context — host page stays unchanged. */
    });
})();
