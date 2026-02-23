import { useEffect, useRef, useState } from "react";

export function useSelectMenu() {
  const [openSelectKey, setOpenSelectKey] = useState(null);
  const selectRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!openSelectKey) return;
      const currentRef = selectRefs.current[openSelectKey];
      if (currentRef && !currentRef.contains(event.target)) {
        setOpenSelectKey(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSelectKey]);

  return {
    openSelectKey,
    setOpenSelectKey,
    selectRefs,
  };
}
