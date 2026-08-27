import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

// How long the up/down highlight stays before fading back
const FLASH_MS = 800;

/**
 * Subscribes to simulated "priceUpdate" ticks from the backend.
 *
 * Each tick is an array of { name, price, change } where `change`
 * is the signed % move since the previous tick.
 *
 * Returns:
 *  - prices: { [stockName]: latestPrice }
 *  - flash:  { [stockName]: "up" | "down" } for recently-ticked stocks
 */
export default function useLivePrices() {
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});
  const timersRef = useRef({});

  useEffect(() => {
    const socket = io(SOCKET_URL);

    function handlePriceUpdate(updates) {
      // 1. merge newest prices
      setPrices((prev) => {
        const next = { ...prev };
        updates.forEach(({ name, price }) => {
          next[name] = price;
        });
        return next;
      });

      // 2. mark direction for the flash effect
      const patch = {};
      updates.forEach(({ name, change }) => {
        patch[name] = change >= 0 ? "up" : "down";
      });
      setFlash((prev) => ({ ...prev, ...patch }));

      // 3. clear each flash shortly after (green/red fade-out)
      updates.forEach(({ name }) => {
        clearTimeout(timersRef.current[name]);
        timersRef.current[name] = setTimeout(() => {
          setFlash((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }, FLASH_MS);
      });
    }

    socket.on("priceUpdate", handlePriceUpdate);

    // cleanup: remove listener, close socket, clear pending timers
    return () => {
      socket.off("priceUpdate", handlePriceUpdate);
      socket.disconnect();
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return { prices, flash };
}
