#!/usr/bin/env python3
"""Dependency-free PNG icon generator (stdlib zlib only).
The VALUE LOOP mark: dark rounded square, a ring split into the five pillar
arcs (V blue, A teal, L purple, U amber, E green), and a solid centre dot.
Supersampled 3x for anti-aliasing.  Run:  python3 make_icons.py
"""
import zlib, struct, math

BG    = (10, 14, 20)
TRACK = (27, 36, 50)
ARCS  = [(77,166,255), (0,224,184), (123,108,255), (255,176,32), (61,220,132)]

def mix(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))

def render(size):
    ss = 3
    S = size * ss
    cx = cy = S / 2
    R  = S * 0.30
    sw = S * 0.062
    corner = S * 0.219
    px = bytearray(S * S * 4)

    def put(x, y, rgb, a=255):
        i = (y*S + x) * 4
        px[i], px[i+1], px[i+2], px[i+3] = rgb[0], rgb[1], rgb[2], a

    for y in range(S):
        for x in range(S):
            dx = max(corner - x, x - (S - corner), 0)
            dy = max(corner - y, y - (S - corner), 0)
            put(x, y, BG, 255 if dx*dx + dy*dy <= corner*corner else 0)

    gap = 8.0                      # degrees of gap between arcs
    seg = 360.0 / len(ARCS)
    for y in range(S):
        for x in range(S):
            fx, fy = x - cx, y - cy
            d = math.hypot(fx, fy)
            if abs(d - R) > sw + 2*ss:
                continue
            a = max(0.0, min(1.0, (sw - abs(d - R)) / (1.5*ss) + 0.5))
            if a <= 0:
                continue
            ang = (math.degrees(math.atan2(fy, fx)) + 90) % 360
            k = int(ang // seg)
            within = ang - k*seg
            col = ARCS[k] if gap/2 <= within <= seg - gap/2 else TRACK
            i = (y*S + x) * 4
            base = (px[i], px[i+1], px[i+2])
            put(x, y, mix(base, col, a) if px[i+3] else col, 255)

    dot = S * 0.105
    for y in range(int(cy-dot)-2, int(cy+dot)+2):
        for x in range(int(cx-dot)-2, int(cx+dot)+2):
            if 0 <= x < S and 0 <= y < S and math.hypot(x-cx, y-cy) <= dot:
                put(x, y, (238, 242, 248), 255)

    out = bytearray(size*size*4)
    for y in range(size):
        for x in range(size):
            r=g=b=a=0
            for oy in range(ss):
                for ox in range(ss):
                    i = ((y*ss+oy)*S + (x*ss+ox))*4
                    r+=px[i]; g+=px[i+1]; b+=px[i+2]; a+=px[i+3]
            n = ss*ss; o = (y*size+x)*4
            out[o]=r//n; out[o+1]=g//n; out[o+2]=b//n; out[o+3]=a//n
    return bytes(out)

def write_png(path, size, rgba):
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + \
               struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        raw += rgba[y*size*4:(y+1)*size*4]
    png  = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)
    print("wrote", path, size)

if __name__ == "__main__":
    for sz in (512, 192, 180):
        write_png(f"icon-{sz}.png", sz, render(sz))
