import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import {
  CategoryToDoContext,
  FunctionToDoContext,
  InputToDoContext,
  ToDoContext,
  ElementsToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import Btn from "../UIkit/Btn/Btn";
import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";
import s from "./ToDoInput.module.scss";
import { ReactComponent as SvgAlarm } from "../../image/alarm.svg";
import { ReactComponent as SvgCalendarDay } from "../../image/calendar-day.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgClock } from "../../image/clock.svg";
import { ReactComponent as SvgAdd } from "../../image/add.svg";
import { formatCalendarDate, getDateInputValue } from "../../utils/calendar";
import {
  buildDeadline,
  formatDeadline,
  getDeadlineDate,
  getDeadlineTime,
} from "../../utils/deadline";
import { useI18n } from "../../i18n/i18n";

const MAX_DEADLINE_DATE = "9999-12-31";

function clampDeadlineDate(value) {
  const year = Number(String(value).split("-")[0]);

  if (year > 9999) {
    return MAX_DEADLINE_DATE;
  }

  return value > MAX_DEADLINE_DATE ? MAX_DEADLINE_DATE : value;
}

function getComposerReserve(inputHeight) {
  const reserveGap = window.innerWidth <= 560 ? 8 : 12;
  return inputHeight + reserveGap;
}

const ToDoInput = memo(
  ({
    deadlineMinDate,
    deadlineMinTime,
    isDeadlineCalendarPicking,
    onDeadlineCalendarPickCancel,
    onDeadlineCalendarPickStart,
    onDeadlinePickerOpenChange,
    onAddItem,
    scheduledDate,
    scheduledTime,
    setScheduledTime,
    textareaRef,
    setTextAreaHeight,
  }) => {
  const inputContainerRef = useRef(null);
  const deadlineTimeTouchedRef = useRef(false);
  const previousInputOffsetRef = useRef(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const { focus, popup } = useContext(ToDoContext);
  const { categoryLabel, locale, t } = useI18n();
  const { cancel } = useContext(ElementsToDoContext);
  const { setPopup } = useContext(FunctionToDoContext);
  const { categoryData } = useContext(CategoryToDoContext);
  const {
    deadline,
    draftCategory,
    input,
    setDeadline,
    setDraftCategory,
    setInput,
  } = useContext(InputToDoContext);
  const deadlineDate = getDeadlineDate(deadline);
  const deadlineTime = getDeadlineTime(deadline);
  const now = new Date();
  const today = getDateInputValue(now);
  const minDeadlineDate =
    deadlineMinDate && deadlineMinDate > today ? deadlineMinDate : today;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const sameDayMinTimes = [deadlineMinTime, currentTime].filter(Boolean).sort();
  const scheduledMinDeadlineTime =
    deadlineDate === minDeadlineDate ? deadlineMinTime : undefined;
  const minDeadlineTime =
    deadlineDate === today
      ? sameDayMinTimes[sameDayMinTimes.length - 1]
      : deadlineDate === minDeadlineDate
      ? deadlineMinTime
      : undefined;

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [textareaRef]);

  const updateInputOffset = useCallback(() => {
    const inputContainer = inputContainerRef.current;

    if (inputContainer) {
      const nextInputOffset = getComposerReserve(inputContainer.offsetHeight);
      const previousInputOffset = previousInputOffsetRef.current;

      setTextAreaHeight(nextInputOffset);
      previousInputOffsetRef.current = nextInputOffset;

      if (
        previousInputOffset !== null &&
        nextInputOffset > previousInputOffset &&
        typeof window.scrollBy === "function"
      ) {
        window.requestAnimationFrame(() => {
          window.scrollBy(0, nextInputOffset - previousInputOffset);
        });
      }
    }
  }, [setTextAreaHeight]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [deadlineOpen, input, resizeTextarea]);

  useLayoutEffect(() => {
    updateInputOffset();
  }, [deadline, deadlineOpen, input, updateInputOffset]);

  useEffect(() => {
    const inputContainer = inputContainerRef.current;

    if (!inputContainer || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateInputOffset);
    observer.observe(inputContainer);

    return () => observer.disconnect();
  }, [updateInputOffset]);

  useEffect(() => {
    if (!deadline) {
      deadlineTimeTouchedRef.current = false;
    }
  }, [deadline]);

  const showDeadlineBeforeScheduledWarning = useCallback(() => {
    setPopup({ type: "deadlineWarning" });
  }, [setPopup]);

  useEffect(() => {
    if (deadlineDate !== minDeadlineDate || !scheduledMinDeadlineTime) {
      return;
    }

    if (!deadlineTime && !deadlineTimeTouchedRef.current) {
      setDeadline(buildDeadline(deadlineDate, scheduledMinDeadlineTime));
    }
  }, [
    deadlineDate,
    deadlineTime,
    minDeadlineDate,
    scheduledMinDeadlineTime,
    setDeadline,
  ]);

  function handleAddItem() {
    if (
      deadlineDate === minDeadlineDate &&
      deadlineTime &&
      minDeadlineTime &&
      deadlineTime < minDeadlineTime
    ) {
      showDeadlineBeforeScheduledWarning();
      return;
    }

    onAddItem();
    setDeadlineOpen(false);
    onDeadlinePickerOpenChange?.(false);
    onDeadlineCalendarPickCancel?.();
  }

  function handleDeadlineButtonClick() {
    if (onDeadlineCalendarPickStart) {
      const shouldOpenPicker = !isDeadlineCalendarPicking;
      onDeadlineCalendarPickStart();
      setDeadlineOpen(shouldOpenPicker);
      onDeadlinePickerOpenChange?.(shouldOpenPicker);
      return;
    }

    setDeadlineOpen((prev) => {
      const next = !prev;
      onDeadlinePickerOpenChange?.(next);
      return next;
    });
  }

  function setRelativeDeadline(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const relativeDateValue = getDateInputValue(date);
    const dateValue =
      relativeDateValue < minDeadlineDate ? minDeadlineDate : relativeDateValue;
    const nextDeadline = buildDeadline(dateValue, deadlineTime);

    if (
      nextDeadline &&
      dateValue === minDeadlineDate &&
      deadlineTime &&
      deadlineMinTime &&
      deadlineTime < deadlineMinTime
    ) {
      setDeadline(nextDeadline);
      return;
    }

    setDeadline(nextDeadline);
  }

  function setDeadlineDate(value) {
    const nextDate = clampDeadlineDate(value);
    const nextDeadline = buildDeadline(nextDate, deadlineTime);

    if (nextDate && nextDate < minDeadlineDate) {
      return;
    }

    if (
      nextDeadline &&
      nextDate === minDeadlineDate &&
      deadlineTime &&
      deadlineMinTime &&
      deadlineTime < deadlineMinTime
    ) {
      setDeadline(nextDeadline);
      return;
    }

    setDeadline(nextDeadline);
  }

  function setDeadlineTime(value) {
    deadlineTimeTouchedRef.current = true;

    const date = deadlineDate || minDeadlineDate;
    const nextDeadline = buildDeadline(date, value);

    if (
      nextDeadline &&
      date === minDeadlineDate &&
      value &&
      deadlineMinTime &&
      value < deadlineMinTime
    ) {
      setDeadline(nextDeadline);
      return;
    }

    setDeadline(nextDeadline);
  }

  return (
    <div className={s.inputContainer} ref={inputContainerRef}>
      <div className={s.input}>
        <textarea
          aria-label={t("todo.text")}
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          rows={1}
          placeholder={t("todo.textPlaceholder")}
        />
        <div className={s.inputBottom}>
          <div className={s.deadlineControls}>
            {focus !== "" && (
              <div className={s.categoryControl}>
                <DropDownMenu
                  categoryTarget="draft"
                  className={s.categoryDropdown}
                  data={categoryData}
                  direction="up"
                  editable
                  getItemLabel={categoryLabel}
                  item={draftCategory}
                  setItem={setDraftCategory}
                  triggerAriaLabel={t("category.selectNote")}
                />
              </div>
            )}
            {scheduledDate && (
              <span className={s.createdAtBadge}>
                {t("todo.date")}: {formatCalendarDate(
                  scheduledDate,
                  { year: undefined },
                  locale
                )}
              </span>
            )}
            {scheduledDate && (
              <label className={s.scheduledTimeControl}>
                <span>{t("todo.scheduledTime")}</span>
                <span className={s.scheduledTimeInput}>
                  <input
                    aria-label={t("todo.scheduledTime")}
                    type="time"
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime?.(event.target.value)}
                  />
                  <span className={s.deadlineFieldIcon} aria-hidden="true">
                    <SvgClock />
                  </span>
                </span>
              </label>
            )}
            <span
              className={[
                deadline ? s.deadlineGroup : "",
                isDeadlineCalendarPicking ? s.deadlineGroupActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                aria-label={t("deadline.pick")}
                className={[
                  s.deadlineButton,
                  isDeadlineCalendarPicking ? s.deadlineButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                onClick={handleDeadlineButtonClick}
              >
                <span className={s.deadlineIcon} aria-hidden="true">
                  <SvgAlarm />
                </span>
                <span>
                  {isDeadlineCalendarPicking
                    ? t("deadline.pickDate")
                    : deadline
                    ? formatDeadline(deadline, new Date(), { locale, t })
                    : t("deadline.label")}
                </span>
              </button>
              {deadline && (
                <button
                  aria-label={t("deadline.clear", {
                    deadline: formatDeadline(deadline, new Date(), { locale, t }),
                  })}
                  className={s.clearDeadlineButton}
                  type="button"
                  onClick={() => {
                    deadlineTimeTouchedRef.current = false;
                    setDeadline("");
                  }}
                >
                  {t("actions.clear")}
                </button>
              )}
            </span>
          </div>
          <div className={s.actions}>
            <AnimatePresence>
              {focus !== "" && !popup && (
                <Btn
                  className={s.cancelAction}
                  collapseLabelOnMobile={true}
                  svgLeft={<SvgCancel />}
                  variant={"dangerGhost"}
                  ariaLabel={t("todo.cancelEdit")}
                  onClick={cancel}
                >
                  {t("actions.cancel")}
                </Btn>
              )}
            </AnimatePresence>
            <Btn
              className={s.submitAction}
              onClick={handleAddItem}
              disabled={!input.trim()}
              ariaLabel={focus !== "" ? t("todo.save") : t("todo.add")}
              svgLeft={focus !== "" ? <SvgCheck /> : <SvgAdd />}
              variant="ghost"
            >
              {focus !== "" ? t("actions.save") : t("actions.add")}
            </Btn>
          </div>
        </div>
        {(deadlineOpen || deadline) && (
          <div className={s.deadlinePicker}>
            <div className={s.deadlineQuickActions}>
              <button type="button" onClick={() => setRelativeDeadline(0)}>
                {t("deadline.today")}
              </button>
              <button type="button" onClick={() => setRelativeDeadline(1)}>
                {t("deadline.tomorrow")}
              </button>
            </div>
            <div className={s.deadlineFields}>
              <label className={s.deadlineField}>
                <span>{t("deadline.date")}</span>
                <span
                  className={`${s.deadlineFieldControl} ${s.deadlineDateControl}`}
                >
                  <input
                    aria-label={t("deadline.label")}
                    max={MAX_DEADLINE_DATE}
                    min={minDeadlineDate}
                    type="date"
                    value={deadlineDate}
                    onChange={(event) => setDeadlineDate(event.target.value)}
                  />
                  <span className={s.deadlineFieldIcon} aria-hidden="true">
                    <SvgCalendarDay />
                  </span>
                </span>
              </label>
              <label className={s.deadlineField}>
                <span>{t("deadline.time")}</span>
                <span
                  className={`${s.deadlineFieldControl} ${s.deadlineTimeControl}`}
                >
                  <input
                    aria-label={t("deadline.timeLabel")}
                    type="time"
                    value={deadlineTime}
                    onChange={(event) => setDeadlineTime(event.target.value)}
                  />
                  <span className={s.deadlineFieldIcon} aria-hidden="true">
                    <SvgClock />
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }
);

export { ToDoInput };
