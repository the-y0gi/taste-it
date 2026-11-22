import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/modules/employee-pos/components/ToastProvider";
import BranchThemeProvider from "@/modules/employee-pos/components/BranchThemeProvider";

export const metadata: Metadata = {
  title: "Pizza Hut POS | Employee Terminal",
  description: "Production-level Restaurant Employee Point of Sale System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased font-sans"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem('rms_branch');
                if (raw) {
                  var b = JSON.parse(raw);
                  if (b && b.themeColor) {
                    var hex = b.themeColor.toLowerCase();
                    var c = hex.replace('#', '').trim();
                    if (c.length === 3) c = c.split('').map(function(x){return x+x;}).join('');
                    var num = parseInt(c, 16);
                    if (!isNaN(num) && c.length === 6) {
                      var r = (num >> 16) & 255;
                      var g = (num >> 8) & 255;
                      var b_ = num & 255;
                      var isDark = r < 50 && g < 50 && b_ < 50;
                      var factor = (100 + (isDark ? 20 : -14)) / 100;
                      var hr = Math.min(255, Math.max(0, Math.round(r * factor)));
                      var hg = Math.min(255, Math.max(0, Math.round(g * factor)));
                      var hb = Math.min(255, Math.max(0, Math.round(b_ * factor)));
                      var hover = 'rgb(' + hr + ',' + hg + ',' + hb + ')';
                      var light = 'rgba(' + r + ',' + g + ',' + b_ + ',0.12)';
                      var muted = 'rgba(' + r + ',' + g + ',' + b_ + ',0.28)';
                      var root = document.documentElement;
                      root.style.setProperty('--rms-brand-primary', hex);
                      root.style.setProperty('--color-brand-primary', hex);
                      root.style.setProperty('--brand-primary', hex);
                      root.style.setProperty('--rms-brand-primary-hover', hover);
                      root.style.setProperty('--color-brand-primary-hover', hover);
                      root.style.setProperty('--rms-brand-primary-light', light);
                      root.style.setProperty('--color-brand-primary-light', light);
                      root.style.setProperty('--rms-brand-primary-muted', muted);
                      root.style.setProperty('--color-brand-primary-muted', muted);
                      root.style.setProperty('--color-orange-500', hex);
                      root.style.setProperty('--color-orange-600', hover);
                      root.style.setProperty('--color-orange-50', light);
                      root.style.setProperty('--color-orange-100', muted);
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <BranchThemeProvider />
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
