import { App as AntdApp, ConfigProvider } from "antd";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#0a0a0a", borderRadius: 8 } }}>
      <AntdApp>
        <div className="min-h-screen bg-[#f7f7f7]">
          <header className="flex h-14 items-center justify-between border-b border-black/10 bg-white px-6">
            <span className="font-arch text-[18px] font-black">
              LOOP<span className="text-black/35">.</span> Admin
            </span>
          </header>
          <main className="mx-auto max-w-[1100px] px-6 py-8">{children}</main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
