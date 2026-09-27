#!/usr/bin/env python3
"""Build standalone single-file versions of the game and the watch page.

    python3 build.py
      -> grammys-apple-pie.html   (the game, opens by double-clicking)
      -> watch-standalone.html    (the live watch page)

Both are derived from index.html / watch.html by inlining the local
<link> and <script src> files. External CDN tags (the Firebase SDK) are
left alone on purpose, so this can never drift from the dev files.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent


def inline(page: str, out_name: str) -> bool:
    src = (ROOT / page).read_text(encoding="utf-8")

    # 1. stylesheet -> <style>
    def sub_css(m):
        css = (ROOT / m.group(1).split("?")[0]).read_text(encoding="utf-8")
        return f"<style>\n{css}\n</style>"
    src, n_css = re.subn(r'<link rel="stylesheet" href="([^"]+)">', sub_css, src)

    # 2. local scripts -> inline; CDN scripts untouched
    def sub_js(m):
        path = m.group(1).split("?")[0]
        if path.startswith(("http://", "https://", "//")):
            return m.group(0)
        body = (ROOT / path).read_text(encoding="utf-8")
        if "</script" in body.lower():
            raise SystemExit(f"error: {path} contains a literal </script> tag")
        return f"<script>\n/* ===== {path} ===== */\n{body}\n</script>"
    src, n_js = re.subn(r'<script src="([^"]+)"></script>', sub_js, src)

    # 3. the boot call lives in index.html already; watch.html has its own inline script
    out = ROOT / out_name
    out.write_text(src, encoding="utf-8")
    print(f"  {out_name:<28} {out.stat().st_size / 1024:>4.0f} KB  "
          f"({n_css} stylesheet + {n_js} scripts inlined)")
    return True


def main() -> int:
    print("building standalone files")
    inline("index.html", "grammys-apple-pie.html")
    inline("watch.html", "watch-standalone.html")

    # sanity: no local references may survive
    for name in ("grammys-apple-pie.html", "watch-standalone.html"):
        text = (ROOT / name).read_text(encoding="utf-8")
        leftover = re.findall(r'(?:src|href)="(js/[^"]+|style\.css)"', text)
        if leftover:
            print(f"  ✗ {name} still references {leftover}", file=sys.stderr)
            return 1
    print("  no local file references remain — both files are portable")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
