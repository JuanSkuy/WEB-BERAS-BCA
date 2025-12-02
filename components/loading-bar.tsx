"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";

export default function TopLoadingBar() {
  const ref = useRef<LoadingBarRef>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    
    if (ref.current) {
      ref.current.continuousStart();
    }

    
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.complete();
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (ref.current) {
        ref.current.complete();
      }
    };
  }, [pathname, searchParams]);

  return (
    <LoadingBar
      ref={ref}
      color="#3b82f6"
      height={3}
      waitingTime={100}
      shadow={true}
    />
  );
}

