// navigator.clipboard only exists in a "secure context" — HTTPS or localhost.
// This app is served over plain HTTP on the Oracle VPS's bare IP (no domain,
// no TLS yet), so navigator.clipboard is undefined there and
// navigator.clipboard.writeText throws before it ever runs. The old
// document.execCommand('copy') path has no such restriction, so it is the
// fallback rather than an afterthought.
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Keep it in the layout (display:none is ignored by some browsers for
  // selection) but off-screen and non-interactive.
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.setAttribute("readonly", "");
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
