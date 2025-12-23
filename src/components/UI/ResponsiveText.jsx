//src/components/UI/ResponsiveText.jsx
import React from "react";

export default function ResponsiveText({
  as = "span",
  minSize = "1rem",        // "14px" or "0.875rem"
  maxSize = "2rem",        // "18px" or "1.125rem"
  minViewport = 393,
  maxViewport = 1440,
  baseFontSize = 16,       // Root font-size in px
  children,
  className = "",
  style = {},
  ...props
}) {
  const Tag = as;

  const parseSize = (size) => {
    const match = size.match(/^([\d.]+)(px|rem)$/);
    if (!match) return null;
    const [_, value, unit] = match;
    const numeric = parseFloat(value);
    const pxValue = unit === "rem" ? numeric * baseFontSize : numeric;
    return { value: numeric, unit, px: pxValue };
  };

  const min = parseSize(minSize);
  const max = parseSize(maxSize);

  let fontSize = minSize;
  let lineHeight;

  if (min && max) {
    const delta = max.px - min.px;
    const preferred = `calc(${min.px}px + ${delta.toFixed(4)} * ((100vw - ${minViewport}px) / ${maxViewport - minViewport}))`;
    fontSize = `clamp(${min.px}px, ${preferred}, ${max.px}px)`;

    // Optional: line-height
    const minLH = (min.px * 1.2).toFixed(2);
    const maxLH = (max.px * 1.2).toFixed(2);
    const deltaLH = (maxLH - minLH).toFixed(4);
    const preferredLH = `calc(${minLH}px + ${deltaLH} * ((100vw - ${minViewport}px) / ${maxViewport - minViewport}))`;
    lineHeight = `clamp(${minLH}px, ${preferredLH}, ${maxLH}px)`;
  }

  return (
    <Tag
      className={className}
      style={{ fontSize, lineHeight, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}

// this will use as
//   <ResponsiveText as = "span" minSize = "1rem" maxSize = "2.1rem" className = "text-baltic-black font-bold">
//      Your text
//   </ResponsiveText >
