'use client';

import { useEffect, useState } from 'react';

export default function StickyHeader({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`
      sticky top-0 z-40 transition-all duration-300
      ${isScrolled ? 'shadow-md' : ''}
    `}>
      {children}
    </div>
  );
}
