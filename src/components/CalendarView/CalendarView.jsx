import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Btn from "../UIkit/Btn/Btn";
import { ToDoElement } from "../ToDoElement/ToDoElement";
import {
  formatCalendarDate,
  getDateInputValue,
  getMonthDays,
  getRelativeMonth,
  getScheduledDate,
  parseInputDate,
  parseTodoCreatedDate,
} from "../../utils/calendar";
import { getDeadlineDate } from "../../utils/deadline";
import { findNoteSearchMatch } from "../../utils/noteSearch";
import { sortItemsByPriority } from "../../utils/todoPriority";
import { ReactComponent as SvgArrowLeft } from "../../image/arrow-left.svg";
import { ReactComponent as SvgArrowRight } from "../../image/arrow-right.svg";
import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { useI18n } from "../../i18n/i18n";
import { isCoarsePointerDevice } from "../../utils/pointer";
import s from "./CalendarView.module.scss";

const YEAR_PICKER_SIZE = 12;
const previewItemAnimation = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 8 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.18 },
};
const calendarTransition = {
  duration: 0.2,
  ease: "easeOut",
};
const calendarTransitionVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction * 24,
    y: direction === 0 ? 8 : 0,
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -24,
    y: direction === 0 ? -8 : 0,
  }),
};
const TOUCH_DRAG_DELAY = 500;
const TOUCH_SCROLL_THRESHOLD = 8;

const CalendarView = memo(
  ({
    items,
    focus,
    onClickCheckBox,
    onClickDelete,
    onClickEdit,
    onClickFavorite,
    onDeleteCompletedDay,
    onReorderItems,
    isDeadlinePicking,
    deadlineMinDate,
    onDateClick,
    searchQuery,
    selectedDeadlineDate,
    selectedDate,
    weekStart = "monday",
  }) => {
    const { locale, t } = useI18n();
    const today = getDateInputValue(new Date());
    const [activeMonth, setActiveMonth] = useState(today);
    const [calendarMode, setCalendarMode] = useState("days");
    const [calendarDirection, setCalendarDirection] = useState(0);
    const [draggingItemId, setDraggingItemId] = useState(null);
    const [orderedCreatedIds, setOrderedCreatedIds] = useState([]);
    const [orderedDeadlineIds, setOrderedDeadlineIds] = useState([]);
    const createdSectionRef = useRef(null);
    const deadlineSectionRef = useRef(null);
    const draggingItemIdRef = useRef(null);
    const draggingSectionRef = useRef(null);
    const orderedCreatedIdsRef = useRef([]);
    const orderedDeadlineIdsRef = useRef([]);
    const pendingTouchDragRef = useRef(null);
    const touchDragTimeoutRef = useRef(null);

    const activeDate = parseInputDate(activeMonth) || new Date();
    const todayDate = parseInputDate(today) || new Date();
    const activeYear = activeDate.getFullYear();
    const activeMonthIndex = activeDate.getMonth();
    const todayYear = todayDate.getFullYear();
    const todayMonthIndex = todayDate.getMonth();
    const months = useMemo(
      () =>
        Array.from({ length: 12 }, (_, monthIndex) => {
          const date = new Date(2026, monthIndex, 1);
          return new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
        }),
      [locale]
    );
    const activeMonthName = months[activeMonthIndex];
    const visibleYearStart =
      activeYear - Math.floor(YEAR_PICKER_SIZE / 2) + 1;
    const weekDays =
      weekStart === "sunday"
        ? t("calendar.weekDaysFromSunday")
        : t("calendar.weekDays");
    const monthDays = useMemo(
      () => getMonthDays(activeMonth, weekStart),
      [activeMonth, weekStart]
    );
    const trimmedSearchQuery = searchQuery.trim();
    const searchMatchesById = useMemo(() => {
      if (!trimmedSearchQuery) {
        return new Map();
      }

      return items.reduce((matches, item) => {
        const searchMatch = findNoteSearchMatch(item.text, trimmedSearchQuery);

        if (searchMatch) {
          matches.set(item.id, searchMatch);
        }

        return matches;
      }, new Map());
    }, [items, trimmedSearchQuery]);
    const searchMatchDates = useMemo(() => {
      if (searchMatchesById.size === 0) {
        return new Set();
      }

      return items.reduce((dates, item) => {
        if (!searchMatchesById.has(item.id)) {
          return dates;
        }

        const createdDate =
          getScheduledDate(item.scheduledAt) ||
          item.createdAt ||
          parseTodoCreatedDate(item.date);
        const deadlineDate = getDeadlineDate(item.deadline);

        if (createdDate) {
          dates.add(createdDate);
        }

        if (deadlineDate) {
          dates.add(deadlineDate);
        }

        return dates;
      }, new Set());
    }, [items, searchMatchesById]);

    const calendarStats = useMemo(() => {
      return items.reduce((stats, item) => {
        const createdDate =
          getScheduledDate(item.scheduledAt) ||
          item.createdAt ||
          parseTodoCreatedDate(item.date);

        if (createdDate) {
          const dayStats = stats.get(createdDate) || { created: 0, deadlines: 0 };
          dayStats.created += 1;
          stats.set(createdDate, dayStats);
        }

        const deadlineDate = getDeadlineDate(item.deadline);

        if (deadlineDate) {
          const dayStats = stats.get(deadlineDate) || { created: 0, deadlines: 0 };
          dayStats.deadlines += 1;
          stats.set(deadlineDate, dayStats);
        }

        return stats;
      }, new Map());
    }, [items]);

    const selectedCreatedItems = useMemo(
      () =>
        sortItemsByPriority(
          items.filter(
            (item) =>
              (getScheduledDate(item.scheduledAt) ||
                item.createdAt ||
                parseTodoCreatedDate(item.date)) === selectedDate
          )
        ),
      [items, selectedDate]
    );
    const selectedCreatedIds = useMemo(
      () => selectedCreatedItems.map((item) => item.id),
      [selectedCreatedItems]
    );

    const selectedDeadlineItems = useMemo(
      () =>
        sortItemsByPriority(
          items.filter((item) => getDeadlineDate(item.deadline) === selectedDate)
        ),
      [items, selectedDate]
    );
    const selectedDeadlineIds = useMemo(
      () => selectedDeadlineItems.map((item) => item.id),
      [selectedDeadlineItems]
    );
    const selectedDayItems = useMemo(() => {
      const itemsById = new Map();

      selectedCreatedItems.forEach((item) => itemsById.set(item.id, item));
      selectedDeadlineItems.forEach((item) => itemsById.set(item.id, item));

      return [...itemsById.values()];
    }, [selectedCreatedItems, selectedDeadlineItems]);
    const selectedCompletedIds = useMemo(
      () => selectedDayItems.filter((item) => item.checked).map((item) => item.id),
      [selectedDayItems]
    );

    const selectedTitle = formatCalendarDate(selectedDate, {}, locale);
    const canDragItems = !trimmedSearchQuery;
    const selectedCreatedItemsById = useMemo(
      () => new Map(selectedCreatedItems.map((item) => [item.id, item])),
      [selectedCreatedItems]
    );
    const selectedDeadlineItemsById = useMemo(
      () => new Map(selectedDeadlineItems.map((item) => [item.id, item])),
      [selectedDeadlineItems]
    );
    const orderedCreatedItems = useMemo(() => {
      const hasSameIds =
        orderedCreatedIds.length === selectedCreatedIds.length &&
        orderedCreatedIds.every((id) => selectedCreatedItemsById.has(id));

      if (!hasSameIds) {
        return selectedCreatedItems;
      }

      return sortItemsByPriority(
        orderedCreatedIds.map((id) => selectedCreatedItemsById.get(id)).filter(Boolean)
      );
    }, [
      orderedCreatedIds,
      selectedCreatedIds.length,
      selectedCreatedItems,
      selectedCreatedItemsById,
    ]);
    const orderedDeadlineItems = useMemo(() => {
      const hasSameIds =
        orderedDeadlineIds.length === selectedDeadlineIds.length &&
        orderedDeadlineIds.every((id) => selectedDeadlineItemsById.has(id));

      if (!hasSameIds) {
        return selectedDeadlineItems;
      }

      return sortItemsByPriority(
        orderedDeadlineIds
          .map((id) => selectedDeadlineItemsById.get(id))
          .filter(Boolean)
      );
    }, [
      orderedDeadlineIds,
      selectedDeadlineIds.length,
      selectedDeadlineItems,
      selectedDeadlineItemsById,
    ]);

    useEffect(() => {
      orderedCreatedIdsRef.current = selectedCreatedIds;
      setOrderedCreatedIds(selectedCreatedIds);
    }, [selectedCreatedIds]);

    useEffect(() => {
      orderedDeadlineIdsRef.current = selectedDeadlineIds;
      setOrderedDeadlineIds(selectedDeadlineIds);
    }, [selectedDeadlineIds]);

    const getSectionState = useCallback((section) => {
      if (section === "deadline") {
        return {
          ids: orderedDeadlineIdsRef.current,
          ref: deadlineSectionRef,
          setIds: setOrderedDeadlineIds,
          updateRef: (ids) => {
            orderedDeadlineIdsRef.current = ids;
          },
        };
      }

      return {
        ids: orderedCreatedIdsRef.current,
        ref: createdSectionRef,
        setIds: setOrderedCreatedIds,
        updateRef: (ids) => {
          orderedCreatedIdsRef.current = ids;
        },
      };
    }, []);

    const getNextOrderedIds = useCallback(
      (pointerY) => {
        const draggingId = draggingItemIdRef.current;
        const section = draggingSectionRef.current;

        if (!draggingId || !section) {
          return [];
        }

        const { ids, ref } = getSectionState(section);
        const idsWithoutDraggedItem = ids.filter((id) => id !== draggingId);
        let insertIndex = idsWithoutDraggedItem.length;

        idsWithoutDraggedItem.some((id, index) => {
          const element = ref.current?.querySelector(`[data-drag-id="${id}"]`);

          if (!element) {
            return false;
          }

          const rect = element.getBoundingClientRect();
          const itemCenterY = rect.top + rect.height / 2;

          if (pointerY < itemCenterY) {
            insertIndex = index;
            return true;
          }

          return false;
        });

        return [
          ...idsWithoutDraggedItem.slice(0, insertIndex),
          draggingId,
          ...idsWithoutDraggedItem.slice(insertIndex),
        ];
      },
      [getSectionState]
    );

    const clearPendingTouchDrag = useCallback(() => {
      if (touchDragTimeoutRef.current) {
        window.clearTimeout(touchDragTimeoutRef.current);
        touchDragTimeoutRef.current = null;
      }

      pendingTouchDragRef.current = null;
    }, []);

    const startDragging = useCallback((section, id) => {
      draggingItemIdRef.current = id;
      draggingSectionRef.current = section;
      setDraggingItemId(id);
    }, []);

    const handlePointerMove = useCallback(
      (event) => {
        const pendingTouchDrag = pendingTouchDragRef.current;

        if (pendingTouchDrag && !draggingItemIdRef.current) {
          const movedY = Math.abs(event.clientY - pendingTouchDrag.startY);

          if (movedY > TOUCH_SCROLL_THRESHOLD) {
            clearPendingTouchDrag();
          }

          return;
        }

        const section = draggingSectionRef.current;

        if (!draggingItemIdRef.current || !section) {
          return;
        }

        if (event.pointerType === "touch") {
          event.preventDefault();
        }

        const nextOrderedIds = getNextOrderedIds(event.clientY);
        const { ids, setIds, updateRef } = getSectionState(section);

        if (nextOrderedIds.join("|") !== ids.join("|")) {
          updateRef(nextOrderedIds);
          setIds(nextOrderedIds);
        }
      },
      [clearPendingTouchDrag, getNextOrderedIds, getSectionState]
    );

    const handlePointerUp = useCallback(() => {
      const section = draggingSectionRef.current;
      clearPendingTouchDrag();

      if (section) {
        const { ids } = getSectionState(section);
        onReorderItems([...ids].reverse());
      }

      draggingItemIdRef.current = null;
      draggingSectionRef.current = null;
      setDraggingItemId(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    }, [clearPendingTouchDrag, getSectionState, handlePointerMove, onReorderItems]);

    const handleTouchMove = useCallback(
      (event) => {
        const touch = event.touches?.[0] || event.changedTouches?.[0];

        if (!touch) {
          return;
        }

        const pendingTouchDrag = pendingTouchDragRef.current;

        if (pendingTouchDrag && !draggingItemIdRef.current) {
          const movedY = Math.abs(touch.clientY - pendingTouchDrag.startY);

          if (movedY > TOUCH_SCROLL_THRESHOLD) {
            clearPendingTouchDrag();
          }

          return;
        }

        const section = draggingSectionRef.current;

        if (!draggingItemIdRef.current || !section) {
          return;
        }

        event.preventDefault();
        const nextOrderedIds = getNextOrderedIds(touch.clientY);
        const { ids, setIds, updateRef } = getSectionState(section);

        if (nextOrderedIds.join("|") !== ids.join("|")) {
          updateRef(nextOrderedIds);
          setIds(nextOrderedIds);
        }
      },
      [clearPendingTouchDrag, getNextOrderedIds, getSectionState]
    );

    const handleTouchEnd = useCallback(() => {
      const section = draggingSectionRef.current;
      clearPendingTouchDrag();

      if (section) {
        const { ids } = getSectionState(section);
        onReorderItems([...ids].reverse());
      }

      draggingItemIdRef.current = null;
      draggingSectionRef.current = null;
      setDraggingItemId(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    }, [
      clearPendingTouchDrag,
      getSectionState,
      handlePointerMove,
      handlePointerUp,
      handleTouchMove,
      onReorderItems,
    ]);

    useEffect(() => {
      return () => {
        clearPendingTouchDrag();
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseup", handlePointerUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
      };
    }, [
      clearPendingTouchDrag,
      handlePointerMove,
      handlePointerUp,
      handleTouchEnd,
      handleTouchMove,
    ]);

    function setActiveCalendarMonth(year, monthIndex) {
      setActiveMonth(getDateInputValue(new Date(year, monthIndex, 1)));
    }

    function handlePreviousPeriod() {
      setCalendarDirection(-1);

      if (calendarMode === "years") {
        setActiveCalendarMonth(activeYear - YEAR_PICKER_SIZE, activeMonthIndex);
        return;
      }

      if (calendarMode === "months") {
        setActiveCalendarMonth(activeYear - 1, activeMonthIndex);
        return;
      }

      setActiveMonth((value) => getRelativeMonth(value, -1));
    }

    function handleNextPeriod() {
      setCalendarDirection(1);

      if (calendarMode === "years") {
        setActiveCalendarMonth(activeYear + YEAR_PICKER_SIZE, activeMonthIndex);
        return;
      }

      if (calendarMode === "months") {
        setActiveCalendarMonth(activeYear + 1, activeMonthIndex);
        return;
      }

      setActiveMonth((value) => getRelativeMonth(value, 1));
    }

    function toggleCalendarMode(mode) {
      setCalendarDirection(0);
      setCalendarMode((currentMode) => (currentMode === mode ? "days" : mode));
    }

    function selectPickerDate(year, monthIndex) {
      setCalendarDirection(0);
      setActiveCalendarMonth(year, monthIndex);
      setCalendarMode("days");
    }

    function handlePointerDown(section, id, event) {
      const shouldRequireLongPress =
        event.pointerType === "touch" || isCoarsePointerDevice();

      if (
        !canDragItems ||
        draggingItemIdRef.current ||
        pendingTouchDragRef.current ||
        (!shouldRequireLongPress && event.button !== 0)
      ) {
        return;
      }

      if (event.target.closest("button, a, input, textarea")) {
        return;
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);

      if (shouldRequireLongPress) {
        event.currentTarget?.setPointerCapture?.(event.pointerId);
        pendingTouchDragRef.current = {
          id,
          section,
          startY: event.clientY,
        };
        touchDragTimeoutRef.current = window.setTimeout(() => {
          if (pendingTouchDragRef.current?.id === id) {
            clearPendingTouchDrag();
            startDragging(section, id);
          }
        }, TOUCH_DRAG_DELAY);
        return;
      }

      event.preventDefault();
      startDragging(section, id);
    }

    function handleTouchStart(section, id, event) {
      const pendingTouchDrag = pendingTouchDragRef.current;

      if (!canDragItems || draggingItemIdRef.current) {
        return;
      }

      if (
        pendingTouchDrag &&
        (pendingTouchDrag.id !== id || pendingTouchDrag.section !== section)
      ) {
        return;
      }

      if (event.target.closest("button, a, input, textarea")) {
        return;
      }

      const touch = event.touches?.[0];

      if (!touch) {
        return;
      }

      clearPendingTouchDrag();
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchcancel", handleTouchEnd);

      pendingTouchDragRef.current = {
        id,
        section,
        startY: touch.clientY,
      };
      touchDragTimeoutRef.current = window.setTimeout(() => {
        if (pendingTouchDragRef.current?.id === id) {
          clearPendingTouchDrag();
          startDragging(section, id);
        }
      }, TOUCH_DRAG_DELAY);
    }

    function renderPreviewItem(item, section) {
      return (
        <ToDoElement
          blockAnimation={previewItemAnimation}
          checked={item.checked}
          date={item.date}
          deadline={item.deadline}
          scheduledAt={item.scheduledAt}
          draggable={canDragItems}
          favorite={item.favorite}
          focus={focus}
          id={item.id}
          isDragging={draggingItemId === item.id}
          key={item.id}
          onClickCheckBox={onClickCheckBox}
          onClickDelete={onClickDelete}
          onClickEdit={onClickEdit}
          onClickFavorite={onClickFavorite}
          onPointerDown={(id, event) => handlePointerDown(section, id, event)}
          onTouchStart={(id, event) => handleTouchStart(section, id, event)}
          category={item.category}
          searchMatch={searchMatchesById.get(item.id) || null}
          text={item.text}
        />
      );
    }

    return (
      <div className={s.root}>
        <section className={s.calendarPanel} aria-label={t("calendar.aria")}>
          <div className={s.calendarHeader}>
            <button
              aria-label={
                calendarMode === "years"
                  ? t("calendar.previousYears")
                  : calendarMode === "months"
                  ? t("calendar.previousYear")
                  : t("calendar.previousMonth")
              }
              type="button"
              onClick={handlePreviousPeriod}
            >
              <SvgArrowLeft aria-hidden="true" />
            </button>
            <h2 className={s.calendarTitle}>
              <button
                aria-label={t("calendar.selectMonth", { month: activeMonthName })}
                className={calendarMode === "months" ? s.activeTitleButton : ""}
                type="button"
                onClick={() => toggleCalendarMode("months")}
              >
                {activeMonthName}
              </button>
              <button
                aria-label={t("calendar.selectYear", { year: activeYear })}
                className={calendarMode === "years" ? s.activeTitleButton : ""}
                type="button"
                onClick={() => toggleCalendarMode("years")}
              >
                {activeYear}
              </button>
            </h2>
            <button
              aria-label={
                calendarMode === "years"
                  ? t("calendar.nextYears")
                  : calendarMode === "months"
                  ? t("calendar.nextYear")
                  : t("calendar.nextMonth")
              }
              type="button"
              onClick={handleNextPeriod}
            >
              <SvgArrowRight aria-hidden="true" />
            </button>
          </div>
          <AnimatePresence mode="wait" custom={calendarDirection}>
            <motion.div
              animate="center"
              className={s.calendarBody}
              custom={calendarDirection}
              data-testid={`calendar-transition-${calendarMode}`}
              exit="exit"
              initial="enter"
              key={`${calendarMode}-${activeMonth}-${visibleYearStart}`}
              transition={calendarTransition}
              variants={calendarTransitionVariants}
            >
              {calendarMode === "months" ? (
                <div className={s.pickerGrid}>
                  {months.map((month, monthIndex) => (
                    <button
                      aria-label={t("calendar.setMonth", { month })}
                      className={[
                        monthIndex === activeMonthIndex ? s.activePickerCell : "",
                        activeYear === todayYear && monthIndex === todayMonthIndex
                          ? s.todayPickerCell
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={month}
                      type="button"
                      onClick={() => selectPickerDate(activeYear, monthIndex)}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              ) : calendarMode === "years" ? (
                <div className={s.pickerGrid}>
                  {Array.from({ length: YEAR_PICKER_SIZE }, (_, index) => {
                    const year = visibleYearStart + index;

                    return (
                      <button
                        aria-label={t("calendar.setYear", { year })}
                        className={[
                          year === activeYear ? s.activePickerCell : "",
                          year === todayYear ? s.todayPickerCell : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={year}
                        type="button"
                        onClick={() => selectPickerDate(year, activeMonthIndex)}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className={s.weekDays} aria-label={t("calendar.weekdays")}>
                    {weekDays.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className={s.monthGrid}>
                    {monthDays.map((day) => {
                      const stats = calendarStats.get(day.value) || {
                        created: 0,
                        deadlines: 0,
                      };
                      const formattedDay = formatCalendarDate(day.value, {}, locale);
                      const label = isDeadlinePicking
                        ? t("calendar.pickDeadline", { date: formattedDay })
                        : t("calendar.openDay", { date: formattedDay });
                      const hasEvents = stats.created > 0 || stats.deadlines > 0;
                      const hasSearchMatch = searchMatchDates.has(day.value);
                      const minDeadlineDate = deadlineMinDate || today;
                      const isPastDeadlineDay =
                        isDeadlinePicking && day.value < minDeadlineDate;

                      return (
                        <button
                          aria-label={label}
                          aria-disabled={isPastDeadlineDay}
                          className={[
                            s.dayCell,
                            day.inCurrentMonth ? "" : s.outsideMonth,
                            day.value === today ? s.today : "",
                            day.value === selectedDate ? s.selectedDay : "",
                            day.value === selectedDeadlineDate
                              ? s.selectedDeadlineDay
                              : "",
                            hasSearchMatch ? s.searchMatchDay : "",
                            isDeadlinePicking ? s.deadlinePickMode : "",
                            isPastDeadlineDay ? s.pastDeadlineDay : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          disabled={isPastDeadlineDay}
                          key={day.value}
                          type="button"
                          onClick={() => onDateClick(day.value)}
                        >
                          <span className={s.dayNumber}>{day.date.getDate()}</span>
                          {hasEvents && (
                            <span className={s.dayStats}>
                              {stats.created > 0 && (
                                <span className={s.createdStat}>
                                  <span className={s.statFull}>
                                    {t("calendar.addedFull", { count: stats.created })}
                                  </span>
                                  <span className={s.statShort}>
                                    {t("calendar.addedShort", { count: stats.created })}
                                  </span>
                                </span>
                              )}
                              {stats.deadlines > 0 && (
                                <span className={s.deadlineStat}>
                                  <span className={s.statFull}>
                                    {t("calendar.deadlineFull", {
                                      count: stats.deadlines,
                                    })}
                                  </span>
                                  <span className={s.statShort}>
                                    {t("calendar.deadlineShort", {
                                      count: stats.deadlines,
                                    })}
                                  </span>
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <section className={s.dayPanel} aria-label={t("calendar.selectedDayNotes")}>
          <div className={s.dayHeader}>
            <h2>{selectedTitle}</h2>
            <div
              className={s.dayStatsSummary}
              aria-label={t("calendar.dayStats")}
            >
              {t("calendar.selectedDayStats", {
                created: selectedCreatedItems.length,
                deadlines: selectedDeadlineItems.length,
              })}
            </div>
            <div className={s.dayActions} aria-label={t("calendar.dayManagement")}>
              <Btn
                ariaLabel={t("calendar.deleteCompletedForDate", { date: selectedTitle })}
                className={s.completedBtn}
                disabled={selectedCompletedIds.length === 0}
                svgLeft={<SvgDelete />}
                variant="BGnone"
                onClick={() =>
                  onDeleteCompletedDay(selectedCompletedIds, selectedTitle)
                }
              >
                {t("header.completed")}
              </Btn>
            </div>
          </div>

          <div
            ref={createdSectionRef}
            className={s.daySection}
            aria-label={t("calendar.addedSectionAria")}
          >
            <h3>{t("calendar.addedTitle")}</h3>
            {orderedCreatedItems.length > 0 ? (
              orderedCreatedItems.map((item) => renderPreviewItem(item, "created"))
            ) : (
              <div className={s.emptyState}>{t("calendar.emptyAdded")}</div>
            )}
          </div>

          <div
            ref={deadlineSectionRef}
            className={s.daySection}
            aria-label={t("calendar.deadlinesSectionAria")}
          >
            <h3>{t("calendar.deadlinesTitle")}</h3>
            {orderedDeadlineItems.length > 0 ? (
              orderedDeadlineItems.map((item) => renderPreviewItem(item, "deadline"))
            ) : (
              <div className={s.emptyState}>{t("calendar.emptyDeadlines")}</div>
            )}
          </div>
        </section>
      </div>
    );
  }
);

export { CalendarView };
