#!/usr/bin/env python3
"""Inline css + js into a single self-contained standalone.html.
Run: python3 build_standalone.py"""
import re, pathlib

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()

# Inline the stylesheet
css = (root / "css" / "styles.css").read_text()
html = re.sub(r'<link rel="stylesheet" href="css/styles.css"\s*/?>',
              f"<style>\n{css}\n</style>", html)

# Drop manifest + icon links (single file has no companion assets)
html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="icon"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', "", html)

# Inline each script in order
def inline(m):
    src = m.group(1)
    code = (root / src).read_text()
    return f"<script>\n{code}\n</script>"

html = re.sub(r'<script src="([^"]+)"></script>', inline, html)

(root / "standalone.html").write_text(html)
print(f"standalone.html written ({len(html):,} bytes)")
