#!/usr/bin/env python3
"""Inline css + js into self-contained single files.
Run: python3 build_standalone.py  ->  standalone.html, liftcards-standalone.html"""
import re, pathlib

root = pathlib.Path(__file__).parent


def bundle(source, out, rewrite=()):
    html = (root / source).read_text()

    # Inline the stylesheets
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>',
                  lambda m: "<style>\n" + (root / m.group(1)).read_text() + "\n</style>", html)

    # Drop manifest + icon links (a single file has no companion assets)
    html = re.sub(r'\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>', "", html)

    # Inline each script in order
    html = re.sub(r'<script src="([^"]+)"></script>',
                  lambda m: "<script>\n" + (root / m.group(1)).read_text() + "\n</script>", html)

    for old, new in rewrite:
        html = html.replace(old, new)

    (root / out).write_text(html)
    print(f"{out} written ({len(html):,} bytes)")


bundle("index.html", "standalone.html",
       rewrite=[('href="liftcards.html"', 'href="liftcards-standalone.html"')])
bundle("liftcards.html", "liftcards-standalone.html",
       rewrite=[('href="./index.html"', 'href="standalone.html"')])
