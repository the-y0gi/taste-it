'use client';

import React, { useEffect } from 'react';
import axios from 'axios';

/**
 * Convert hex color to rgb components
 */
function hexToRgb(hex: string) {
  let c = (hex || '').replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num) || c.length !== 6) {
    return { r: 249, g: 115, b: 22 }; // default brand orange #f97316
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Adjust color brightness for hover states
 */
function adjustBrightness(r: number, g: number, b: number, percent: number) {
  const factor = (100 + percent) / 100;
  const adjR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const adjG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const adjB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${adjR}, ${adjG}, ${adjB})`;
}

/**
 * Dynamically injects theme CSS variables into the document root
 */
export function applyThemeColor(colorInput?: string) {
  if (typeof window === 'undefined') return;

  const hex = (colorInput && colorInput.startsWith('#') ? colorInput : `#${colorInput || 'f97316'}`).toLowerCase();
  const { r, g, b } = hexToRgb(hex);

  // Hover state (darken by 14% unless very dark, then lighten by 15%)
  const isVeryDark = r < 50 && g < 50 && b < 50;
  const hoverColor = adjustBrightness(r, g, b, isVeryDark ? 20 : -14);
  const lightColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const mutedColor = `rgba(${r}, ${g}, ${b}, 0.28)`;

  const root = document.documentElement;

  // 1. Brand Primary variables (used by Tailwind @theme inline and utility classes)
  root.style.setProperty('--rms-brand-primary', hex);
  root.style.setProperty('--color-brand-primary', hex);
  root.style.setProperty('--brand-primary', hex);

  // 2. Hover states
  root.style.setProperty('--rms-brand-primary-hover', hoverColor);
  root.style.setProperty('--color-brand-primary-hover', hoverColor);
  root.style.setProperty('--brand-primary-hover', hoverColor);

  // 3. Light backgrounds (12% opacity tint)
  root.style.setProperty('--rms-brand-primary-light', lightColor);
  root.style.setProperty('--color-brand-primary-light', lightColor);
  root.style.setProperty('--brand-primary-light', lightColor);

  // 4. Muted / border accents (28% opacity)
  root.style.setProperty('--rms-brand-primary-muted', mutedColor);
  root.style.setProperty('--color-brand-primary-muted', mutedColor);
  root.style.setProperty('--brand-primary-muted', mutedColor);

  // 5. Override orange utility palette in Tailwind v4 so active category cards & badges match theme
  root.style.setProperty('--color-orange-500', hex);
  root.style.setProperty('--color-orange-600', hoverColor);
  root.style.setProperty('--color-orange-50', lightColor);
  root.style.setProperty('--color-orange-100', mutedColor);
  root.style.setProperty('--color-orange-200', mutedColor);
}

export default function BranchThemeProvider() {
  useEffect(() => {
    // 1. Immediately apply color from localStorage if available
    const applyStoredTheme = () => {
      try {
        const raw = localStorage.getItem('rms_branch');
        if (raw) {
          const b = JSON.parse(raw);
          if (b.themeColor) {
            applyThemeColor(b.themeColor);
          }
        }
      } catch (e) {}
    };

    applyStoredTheme();

    // 2. Fetch fresh branch profile from backend to ensure real-time sync with Superadmin updates
    const fetchFreshProfile = async () => {
      try {
        const raw = localStorage.getItem('rms_branch');
        const existing = raw ? JSON.parse(raw) : null;
        const branchId = existing?._id || existing?.id;
        const token = existing?.token || '';
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let freshData: any = null;

        // Try authenticated /me
        try {
          const res = await axios.get(`${API_URL}/branches/me`, {
            withCredentials: true,
            headers,
          });
          if (res.data?.success && res.data?.data) {
            freshData = res.data.data;
          }
        } catch {
          // Fallback to public settings endpoint if available
          if (branchId) {
            try {
              const res2 = await axios.get(`${API_URL}/branches/settings?branchId=${branchId}`);
              if (res2.data?.success && res2.data?.data) {
                freshData = res2.data.data;
              }
            } catch {}
          }
        }

        if (freshData && freshData.themeColor) {
          applyThemeColor(freshData.themeColor);
          if (existing) {
            const merged = { ...existing, ...freshData };
            localStorage.setItem('rms_branch', JSON.stringify(merged));
            window.dispatchEvent(new Event('rms_branch_updated'));
          }
        }
      } catch (err) {
        console.error('BranchThemeProvider sync error:', err);
      }
    };

    fetchFreshProfile();

    // 3. Re-sync when user returns to this tab (window focus) or localStorage changes
    window.addEventListener('focus', fetchFreshProfile);
    window.addEventListener('storage', applyStoredTheme);
    window.addEventListener('rms_branch_updated', applyStoredTheme);
    window.addEventListener('rms_branch_settings_changed', applyStoredTheme);

    return () => {
      window.removeEventListener('focus', fetchFreshProfile);
      window.removeEventListener('storage', applyStoredTheme);
      window.removeEventListener('rms_branch_updated', applyStoredTheme);
      window.removeEventListener('rms_branch_settings_changed', applyStoredTheme);
    };
  }, []);

  return null;
}
