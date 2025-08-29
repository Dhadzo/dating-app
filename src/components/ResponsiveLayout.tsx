import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarNavigation from './SidebarNavigation';
import BottomNavigation from './BottomNavigation';

const ResponsiveLayout = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when route changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="h-screen bg-gray-50 overflow-hidden">
      {/* Desktop: Sidebar + Main Content */}
      <div className="lg:flex">
        <SidebarNavigation />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-72">
          {/* Content with bottom padding for mobile bottom nav and top padding for fixed header */}
          <div className="pb-16 lg:pb-0 pt-14 sm:pt-16">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default ResponsiveLayout;
