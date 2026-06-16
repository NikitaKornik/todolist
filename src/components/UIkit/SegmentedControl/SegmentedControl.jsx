import React, { memo } from "react";
import cn from "classnames";
import s from "./SegmentedControl.module.scss";

const SegmentedControl = memo(
  ({ ariaLabel, className, options, value, onChange }) => {
    return (
      <div className={cn(s.root, className)} aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            aria-label={option.ariaLabel}
            className={value === option.value ? s.active : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className={s.icon} aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    );
  }
);

export { SegmentedControl };
