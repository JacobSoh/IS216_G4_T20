'use client'

import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

export const useResponsive = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ensures code runs only on client
  }, []);

  const isMobile = useMediaQuery({ query: "(max-width: 639px)" });
  const isTablet = useMediaQuery({ query: "(min-width: 640px) and (max-width: 1023px)" });
  const isDesktop = useMediaQuery({ query: "(min-width: 1024px)" });

  return {
    isMobile: mounted ? isMobile : false,
    isTablet: mounted ? isTablet : false,
    isDesktop: mounted ? isDesktop : true, // default to desktop so something renders on SSR
  };
};
