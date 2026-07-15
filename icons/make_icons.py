#!/usr/bin/env python3
"""Dependency-free PNG icon generator (stdlib zlib only).
Renders the APEX mark: dark rounded square, teal->purple progress ring,
and an upward apex triangle. Supersampled 3x for anti-aliasing."""
import zlib, struct, math

def lerp(a, b, t): return a + (b - a) * t
def mix(c1, c2, t): return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))

BG   = (10, 14, 20)
TRACK= (27, 36, 50)
TEAL = (0, 224, 184)
PURP = (123, 108, 255)

def render(size):
    ss = 3
    S = size * ss
    cx = cy = S / 2
    R = S * 0.293          # ring radius
    sw = S * 0.059         # stroke half-width base
    corner = S * 0.219     # rounded-corner radius
    px = bytearray(S * S * 4)

    def put(x, y, rgb, a=255):
        i = (y * S + x) * 4
        px[i], px[i+1], px[i+2], px[i+3] = rgb[0], rgb[1], rgb[2], a

    # background rounded square
    for y in range(S):
        for x in range(S):
            # rounded-rect alpha
            dx = max(corner - x, x - (S - corner), 0)
            dy = max(corner - y, y - (S - corner), 0)
            inside = (dx*dx + dy*dy) <= corner*corner
            put(x, y, BG, 255 if inside else 0)

    # progress ring: from angle -90deg sweeping ~270deg (75%)
    def ring_alpha(dist, half):
        edge = 1.5 * ss
        return max(0.0, min(1.0, (half - abs(dist)) / edge + 0.5))

    for y in range(S):
        for x in range(S):
            fx, fy = x - cx, y - cy
            d = math.hypot(fx, fy)
            half = sw
            if abs(d - R) <= half + 2*ss:
                ang = (math.degrees(math.atan2(fy, fx)) + 90) % 360  # 0 at top, clockwise
                a = ring_alpha(d - R, half)
                if a <= 0: continue
                base = TRACK
                if ang <= 270:   # active portion
                    t = ang / 270
                    base = mix(TEAL, PURP, t)
                i = (y * S + x) * 4
                if px[i+3] == 0 and base is TRACK:
                    continue
                # blend over existing
                ex = (px[i], px[i+1], px[i+2])
                out = mix(ex, base, a) if px[i+3] else base
                put(x, y, out, 255)

    # apex triangle (filled gradient), pointing up
    tipx, tipy = cx, cy - S*0.172
    blx, bly   = cx - S*0.129, cy + S*0.172
    brx, bry   = cx + S*0.129, cy + S*0.172
    # notch bottom center
    nx, ny     = cx, cy + S*0.086
    def in_tri(px_, py_, a, b, c):
        def sign(p1, p2, p3): return (p1[0]-p3[0])*(p2[1]-p3[1]) - (p2[0]-p3[0])*(p1[1]-p3[1])
        p=(px_,py_); d1=sign(p,a,b); d2=sign(p,b,c); d3=sign(p,c,a)
        neg=(d1<0)or(d2<0)or(d3<0); pos=(d1>0)or(d2>0)or(d3>0)
        return not(neg and pos)
    A=(tipx,tipy); L=(blx,bly); R2=(brx,bry); N=(nx,ny)
    for y in range(int(tipy)-2, int(bly)+2):
        for x in range(int(blx)-2, int(brx)+2):
            if 0<=x<S and 0<=y<S:
                # left half tri A,L,N  and right half A,N,R2
                if in_tri(x,y,A,L,N) or in_tri(x,y,A,N,R2):
                    ang = (x - blx) / (brx - blx)
                    put(x, y, mix(TEAL, PURP, max(0,min(1,ang))), 255)

    # downscale (box filter) to target size
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r=g=b=a=0
            for oy in range(ss):
                for ox in range(ss):
                    i=((y*ss+oy)*S + (x*ss+ox))*4
                    r+=px[i]; g+=px[i+1]; b+=px[i+2]; a+=px[i+3]
            n=ss*ss
            o=(y*size+x)*4
            out[o]=r//n; out[o+1]=g//n; out[o+2]=b//n; out[o+3]=a//n
    return bytes(out)

def write_png(path, size, rgba):
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        raw += rgba[y*size*4:(y+1)*size*4]
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)
    print("wrote", path, size)

for sz in (512, 192, 180):
    write_png(f"icon-{sz}.png", sz, render(sz))
