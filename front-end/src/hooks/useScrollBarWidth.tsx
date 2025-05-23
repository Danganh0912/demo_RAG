import { useState, useEffect } from "react";

const useScrollbarWidth = () => {
  const [width, setWidth] = useState(window.innerWidth - window.innerWidth * 0.01); // Ước tính scrollbar ~1%

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth - (window.innerWidth - document.documentElement.clientWidth));
    };
    updateWidth(); // Gọi ngay lần đầu để cập nhật width chính xác
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return width;
};

export default useScrollbarWidth;
