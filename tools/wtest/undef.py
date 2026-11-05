import re
s=open('/tmp/bc-script.js').read()
# strip strings/comments crudely
s2=re.sub(r'//[^\n]*','',s)
s2=re.sub(r'/\*.*?\*/','',s2,flags=re.S)
defs=set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)',s2))
defs|=set(re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)',s2))
for m in re.finditer(r'\b(?:const|let|var)\s*[\[{]([^\]}=]*)[\]}]',s2):
    defs|=set(re.findall(r'([A-Za-z_$][\w$]*)',m.group(1)))
defs|=set(re.findall(r'([A-Za-z_$][\w$]*)\s*=>',s2))
for m in re.finditer(r'\(([^()]*)\)\s*=>',s2): defs|=set(re.findall(r'([A-Za-z_$][\w$]*)',m.group(1)))
for m in re.finditer(r'function\s*[\w$]*\s*\(([^()]*)\)',s2): defs|=set(re.findall(r'([A-Za-z_$][\w$]*)',m.group(1)))
calls=set(m.group(1) for m in re.finditer(r'(?<![\.\w$])([A-Za-z_$][\w$]*)\s*\(',s2))
kw=set('if for while switch return function catch typeof new await Math Array Object JSON String Number Boolean Set Map Float32Array Uint8Array Int32Array Uint32Array Float64Array Uint16Array Int16Array Int8Array Date Error Promise setTimeout clearTimeout setInterval clearInterval requestAnimationFrame parseInt parseFloat isFinite isNaN encodeURIComponent decodeURIComponent addEventListener removeEventListener matchMedia fetch Image Audio AudioContext alert confirm prompt URLSearchParams Symbol RegExp BigInt structuredClone queueMicrotask btoa atob cancelAnimationFrame getComputedStyle WeakMap WeakSet Proxy Reflect super Function eval OffscreenCanvas TextEncoder Uint8ClampedArray DataView ArrayBuffer Blob URL performance console Infinity void delete in of do else try finally throw yield class extends import export'.split())
for c in sorted(calls-defs-kw):
    print(c)
