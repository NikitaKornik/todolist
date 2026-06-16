import React from "react";
import cn from "classnames";
import { motion } from "framer-motion";

import s from "./Btn.module.scss";

export default function Btn({
  variant,
  className,
  children,
  svgLeft,
  svgRight,
  disabled,
  size,
  onClick,
  round,
  ariaLabel,
  active = false,
  animate = true,
  collapseLabelOnMobile = false,
  tone,
  type = "button",
}) {
  const motionProps = animate
    ? {
        animate: { scale: 1 },
        initial: { scale: 0 },
        exit: { scale: 0 },
      }
    : {};

  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(s.root, s[variant], className, s[size], s[tone], {
        [s.active]: active,
        [s.collapseLabelOnMobile]: collapseLabelOnMobile,
        [s.disabled]: disabled,
        [s.size40]: size === "size40",
        [s.size36]: size === "size36",
        [s.round]: round,
      })}
      onClick={onClick}
      whileHover={
        !disabled && {
          filter: "brightness(1.1)",
        }
      }
      whileTap={
        !disabled && {
          scale: 0.95,
        }
      }
      {...motionProps}
    >
      {svgLeft && (
        <div
          className={cn(s.svg, {
            [s.LeftMargin]: children,
          })}
        >
          {svgLeft}
        </div>
      )}
      {children && <span className={s.label}>{children}</span>}
      {svgRight && (
        <div
          className={cn(s.svg, {
            [s.RightMargin]: children,
          })}
        >
          {svgRight}
        </div>
      )}
    </motion.button>
  );
}
