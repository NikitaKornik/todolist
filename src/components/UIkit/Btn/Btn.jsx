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
  svgFill,
  submit,
  disabled,
  size,
  onClick,
}) {
  return (
    <motion.button
      className={cn(s.root, s[variant], className, {
        [s.disabled]: disabled,
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
      animate={{ scale: 1 }}
      initial={{ scale: 0 }}
      exit={{ scale: 0 }}
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
      {children}
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
