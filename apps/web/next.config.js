/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // โหลด SWC compiler แบบ WASM แทน native binary (@next/swc-win32-x64-msvc)
    // เพราะ Windows Smart App Control บนเครื่อง dev บล็อก native .node addon
    // ("An Application Control policy has blocked this file") ทำให้ build/dev พังทั้งหมด
    // — WASM ช้ากว่านิดหน่อยแต่ไม่โดนบล็อก และทำงานเหมือนกันทุกแพลตฟอร์ม
    useWasmBinary: true,
  },
};

module.exports = nextConfig;
