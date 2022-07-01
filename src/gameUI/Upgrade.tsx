import React, { useEffect, useMemo, useState } from "react";

import { UpgradeSelectionFn, BagXp } from ".";
import upgrades from "../Baggie/upgrades";

const Upgrade = ({
  minute,
  onSelect,
  bagXps,
}: {
  bagXps: BagXp[];
  minute: number;
  onSelect: UpgradeSelectionFn;
}) => {
  const xpForThisBag = useMemo(() => {
    const bag = bagXps.find((b) => b.minute === minute);
    if (!bag) {
      throw new Error("No bagged XP for this minute upgrade.");
    }
    return bag.total;
  }, [minute, bagXps]);

  const [opacity, setOpacity] = useState<number>(0);
  useEffect(() => {
    if (opacity < 1) {
      setTimeout(() => setOpacity(opacity + 0.1), 20);
    }
  }, [opacity]);

  return (
    <div id="upgrade-container" style={{ opacity }}>
      <h1>Minute: {minute}</h1>
      <h1>XP for this minute: {xpForThisBag}</h1>
      <button onClick={() => onSelect(true, null)}>Choose Weapon</button>
      {upgrades.map((u) => {
        return (
          <button key={u.id} onClick={() => onSelect(false, u.id)}>
            Upgrade: {u.name}
          </button>
        );
      })}
    </div>
  );
};

export default Upgrade;
