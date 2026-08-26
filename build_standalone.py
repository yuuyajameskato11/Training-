#!/usr/bin/env python3
"""Inline css + js into a single self-contained standalone.html.

Usage:
    python3 build_standalone.py            # builds APEX (repo root)
    python3 build_standalone.py vloop      # builds VALUE LOOP OS
    python3 build_standalone.py . vloop    # both
"""
import re, sys, pathlib

REPO = pathlib.Path(__file__).parent


def build(dirname="."):
    root = (REPO / dirname).resolve()
    html = (root / "index.html").read_text()

    # Inline the stylesheet
    css = (root / "css" / "styles.css").read_text()
    html = re.sub(r'<link rel="stylesheet" href="css/styles.css"\s*/?>',
                  lambda _: f"<style>\n{css}\n</style>", html)

    # Drop manifest + icon links (single file has no companion assets)
    html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="icon"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', "", html)

    # Inline each script in order
    def inline(m):
        code = (root / m.group(1)).read_text()
        return f"<script>\n{code}\n</script>"

    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)

    # No service worker to register when there is nothing to fetch
    html = html.replace("navigator.serviceWorker.register('sw.js')",
                        "Promise.reject()")

    out = root / "standalone.html"
    out.write_text(html)
    print(f"{out.relative_to(REPO)} written ({len(html):,} bytes)")


if __name__ == "__main__":
    for d in (sys.argv[1:] or ["."]):
        build(d)
