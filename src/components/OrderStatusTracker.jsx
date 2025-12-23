import React from "react";

const steps = ["preparing", "ready", "delivered"];

export default function OrderStatusTracker({ status }) {
  const s = (status || "preparing").toLowerCase();
  const idx = Math.max(0, steps.indexOf(steps.includes(s) ? s : "preparing"));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const active = i <= idx;
          return (
            <div key={step} className="flex-1 flex items-center">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${active ? "bg-vivid-red text-white" : "bg-gray-200 text-gray-500"}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 ${i < idx ? "bg-vivid-red" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-oxford-blue/70">
        <span className="capitalize">Preparing</span>
        <span className="capitalize">Ready</span>
        <span className="capitalize">Delivered</span>
      </div>
    </div>
  );
}
