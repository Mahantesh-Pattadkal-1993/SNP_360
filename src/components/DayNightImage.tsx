"use client";

import Image, { type ImageProps } from "next/image";
import { useDayNight } from "./DayNightProvider";

interface DayNightImageProps extends Omit<ImageProps, "src"> {
  daySrc: string;
  nightSrc: string;
}

export function DayNightImage({ daySrc, nightSrc, alt, ...rest }: DayNightImageProps) {
  const { mode } = useDayNight();
  return <Image src={mode === "night" ? nightSrc : daySrc} alt={alt} {...rest} />;
}
