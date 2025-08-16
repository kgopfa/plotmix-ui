"use client";

import React from "react";
import { iconRegistry } from "@/icons/registry";

export type IconProps = {
  name?: string;
  svg?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  viewBox?: string;
  preserveAspectRatio?: string;
  title?: string;
  role?: string;
  ariaLabel?: string;
  replaceColorsWithCurrent?: boolean;
};

function extractSvgInner(svgMarkup: string): { inner: string; viewBox?: string } {
  if (!svgMarkup) return { inner: "" };
  const openTagMatch = svgMarkup.match(/<svg[^>]*>/i);
  const closeTagMatch = svgMarkup.match(/<\/svg>/i);
  if (openTagMatch && closeTagMatch) {
    const openTag = openTagMatch[0];
    const viewBoxMatch = openTag.match(/viewBox="([^"]+)"/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : undefined;
    const start = openTagMatch.index! + openTag.length;
    const end = closeTagMatch.index!;
    return { inner: svgMarkup.slice(start, end).trim(), viewBox };
  }
  // If it's not a full <svg>, treat it as inner content already
  return { inner: svgMarkup.trim() };
}

function normalizeColorsToCurrent(inner: string): string {
  // Replace stroke/fill colors with currentColor, but keep 'none'
  let normalized = inner;
  normalized = normalized.replace(/stroke="(?!none)[^"]+"/gi, 'stroke="currentColor"');
  normalized = normalized.replace(/fill="(?!none)[^"]+"/gi, 'fill="currentColor"');
  return normalized;
}

export function Icon({
  name,
  svg,
  size = 20,
  color,
  strokeWidth,
  className,
  viewBox,
  preserveAspectRatio = "xMidYMid meet",
  title,
  role = "img",
  ariaLabel,
  replaceColorsWithCurrent = true,
}: IconProps) {
  const raw = name ? iconRegistry[name] : svg;
  if (!raw) return null;

  const { inner: extractedInner, viewBox: extractedViewBox } = extractSvgInner(raw);
  const processedInner = replaceColorsWithCurrent
    ? normalizeColorsToCurrent(extractedInner)
    : extractedInner;

  const resolvedViewBox = viewBox || extractedViewBox || "0 0 24 24";
  const width = typeof size === "number" ? `${size}` : size;
  const height = typeof size === "number" ? `${size}` : size;

  // We wrap with a span so setting `color` applies when using currentColor
  return (
    <span
      className={className}
      style={color ? { color } : undefined}
      role={role}
      aria-label={ariaLabel}
    >
      <svg
        viewBox={resolvedViewBox}
        width={width}
        height={height}
        preserveAspectRatio={preserveAspectRatio}
        stroke="currentColor"
        fill="none"
        {...(strokeWidth ? { strokeWidth } : {})}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: processedInner }}
      />
      {title ? <span className="sr-only">{title}</span> : null}
    </span>
  );
}

export default Icon;


