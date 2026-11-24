'use client';

import React, { useState } from 'react';
import PosNavbar from '@/modules/employee-pos/components/PosNavbar';
import POSSidebarDrawer from '@/modules/employee-pos/components/POSSidebarDrawer';
import TablesFloorView from '@/modules/employee-pos/components/TablesFloorView';
import CheckoutModal from '@/modules/employee-pos/components/CheckoutModal';
import EmployeePermissionGuard from '@/modules/employee-pos/components/EmployeePermissionGuard';

export default function TablesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <EmployeePermissionGuard permissionKey="pos">
      <main className="h-screen flex flex-col overflow-hidden bg-neutral-100 text-neutral-900 font-sans">
        {/* Top Navbar */}
        <PosNavbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Floor Plan View */}
        <TablesFloorView />

        {/* Checkout Modal Overlay for instant settlement on floor plan */}
        <CheckoutModal />

        {/* Sidebar Drawer */}
        <POSSidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab="tables"
          onSelectTab={(tabKey) => {
            if (tabKey === 'pos') {
              window.location.href = '/employee/pos';
            } else if (tabKey === 'kitchen') {
              window.location.href = '/employee/kitchen';
            } else if (tabKey === 'orders') {
              window.location.href = '/employee/orders';
            } else if (tabKey === 'customers') {
              window.location.href = '/employee/customers';
            } else if (tabKey === 'setting') {
              window.location.href = '/employee/settings';
            }
          }}
        />
      </main>
    </EmployeePermissionGuard>
  );
}
