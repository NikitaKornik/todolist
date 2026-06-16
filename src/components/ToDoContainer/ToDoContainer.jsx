import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import cn from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import {
  FunctionToDoContext,
  InputToDoContext,
  ToDoContext,
  CategoryToDoContext,
  ElementsToDoContext,
  SettingsToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import { CalendarView } from "../CalendarView/CalendarView";
import { Header } from "../Header/Header";
import { SettingsView } from "../SettingsView/SettingsView";
import { ToDoElement } from "../ToDoElement/ToDoElement";
import { ToDoInput } from "../ToDoInput/ToDoInput";
import s from "./ToDoContainer.module.scss";
import { findNoteSearchMatch } from "../../utils/noteSearch";
import { getDateInputValue } from "../../utils/calendar";
import {
  buildDeadline,
  getDeadlineDate,
  getDeadlineTime,
} from "../../utils/deadline";
import { sortToDoByPriority } from "../../utils/todoPriority";
import { useI18n } from "../../i18n/i18n";

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

const viewAnimation = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 8 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.18 },
};

const TOUCH_DRAG_DELAY = 500;
const TOUCH_SCROLL_THRESHOLD = 8;

function isCoarsePointerDevice() {
  return (
    typeof window.matchMedia === "function" &&
    Boolean(window.matchMedia("(pointer: coarse)")?.matches)
  );
}

export default function ToDoContainer() {
  const textareaRef = useRef(null);
  const listRef = useRef(null);

  const [columnItems, setColumnItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const previousContentViewModeRef = useRef("list");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() =>
    getDateInputValue(new Date())
  );
  const [isDeadlineCalendarPicking, setIsDeadlineCalendarPicking] =
    useState(false);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [orderedVisibleIds, setOrderedVisibleIds] = useState([]);
  const [headerOffset, setHeaderOffset] = useState(null);
  const orderedVisibleIdsRef = useRef([]);
  const draggingItemIdRef = useRef(null);
  const isReorderingRef = useRef(false);
  const pendingTouchDragRef = useRef(null);
  const touchDragTimeoutRef = useRef(null);

  const { focus, popup, toDoItems } = useContext(ToDoContext);
  const { categoryData, category } = useContext(CategoryToDoContext);
  const { addItem, reorderToDoItems, requestDeleteCompletedItems } =
    useContext(FunctionToDoContext);
  const { deadline, input, setDeadline } = useContext(InputToDoContext);
  const { weekStart } = useContext(SettingsToDoContext);
  const { t } = useI18n();
  const {
    cancel,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    onClickCheckBox,
  } = useContext(ElementsToDoContext);

  const handleFavorite = useCallback((id) => onClickFavorite(id), [onClickFavorite]);
  const handleCheckBox = useCallback((id) => onClickCheckBox(id), [onClickCheckBox]);
  const handleEdit = useCallback(
    (id, text, deadline, category) =>
      onClickEdit({ id, text, deadline, category }),
    [onClickEdit]
  );
  const handleDelete = useCallback(
    (id) =>
      onClickDelete({
        type: "delete",
        itemId: id,
      }),
    [onClickDelete]
  );

  const [textAreaHeight, setTextAreaHeight] = useState(0);

  const inputMaxHeight = useMemo(
    () => ({
      marginTop: headerOffset ? `${headerOffset}px` : undefined,
      paddingBottom: textAreaHeight <= 400 ? `${textAreaHeight}px` : "420px",
    }),
    [headerOffset, textAreaHeight]
  );

  const closeDeadlinePicking = useCallback(() => {
    setIsDeadlineCalendarPicking(false);
    setIsDeadlinePickerOpen(false);
  }, []);

  const handleHeaderHeightChange = useCallback((nextHeaderOffset) => {
    setHeaderOffset((prev) =>
      prev === nextHeaderOffset ? prev : nextHeaderOffset
    );
  }, []);

  const handleViewModeChange = useCallback((nextViewMode) => {
    setViewMode((currentViewMode) => {
      if (nextViewMode === "settings") {
        if (currentViewMode === "settings") {
          return previousContentViewModeRef.current;
        }

        previousContentViewModeRef.current = currentViewMode;
        return "settings";
      }

      previousContentViewModeRef.current = nextViewMode;
      return nextViewMode;
    });
  }, []);

  const scrollToTopAfterCreate = useCallback(() => {
    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleAddItem = useCallback(
    (options = {}) => {
      const shouldScrollToTop = focus === "" && input.trim();

      const didAddItem = addItem(options);

      if (didAddItem && shouldScrollToTop) {
        scrollToTopAfterCreate();
      }

      return didAddItem;
    },
    [addItem, focus, input, scrollToTopAfterCreate]
  );

  useEffect(() => {
    const handleKeyDown = (key) => {
      if (key.key === "Escape") {
        if (!popup && focus !== "") {
          cancel();
        }
      }
      if (key.key === "Enter" && !key.shiftKey) {
        if (!popup && viewMode !== "settings") {
          key.preventDefault();
          const didAddItem = handleAddItem({
            createdAt: viewMode === "calendar" ? selectedCalendarDate : undefined,
          });

          if (didAddItem) {
            closeDeadlinePicking();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    popup,
    focus,
    cancel,
    handleAddItem,
    closeDeadlinePicking,
    selectedCalendarDate,
    viewMode,
  ]);

  useEffect(() => {
    if (viewMode === "calendar" && isDeadlinePickerOpen) {
      setIsDeadlineCalendarPicking(true);
      return;
    }

    if (viewMode !== "calendar") {
      setIsDeadlineCalendarPicking(false);
    }
  }, [isDeadlinePickerOpen, viewMode]);

  const filteredToDo = useMemo(() => {
    const categoryFilteredToDo =
      category === 0
        ? toDoItems
        : toDoItems.filter((item) => {
            const selectedCategory = categoryData.find(
              (categoryItem) => categoryItem.id === category
            );

            return (
              item.category === selectedCategory?.name || item.favorite === true
            );
          });

    const trimmedSearchQuery = searchQuery.trim();

    if (!trimmedSearchQuery) {
      return categoryFilteredToDo.map((item) => ({
        item,
        searchMatch: null,
      }));
    }

    return categoryFilteredToDo
      .map((item) => ({
        item,
        searchMatch: findNoteSearchMatch(item.text, trimmedSearchQuery),
      }))
      .filter(({ searchMatch }) => Boolean(searchMatch));
  }, [toDoItems, category, categoryData, searchQuery]);

  const calendarItems = useMemo(
    () =>
      category === 0
        ? toDoItems
        : toDoItems.filter((item) => {
            const selectedCategory = categoryData.find(
              (categoryItem) => categoryItem.id === category
            );

            return (
              item.category === selectedCategory?.name || item.favorite === true
            );
          }),
    [category, categoryData, toDoItems]
  );

  const visibleToDo = useMemo(
    () => sortToDoByPriority([...filteredToDo].reverse()),
    [filteredToDo]
  );
  const visibleIds = useMemo(
    () => visibleToDo.map(({ item }) => item.id),
    [visibleToDo]
  );
  const canDragItems = !searchQuery.trim();
  const visibleToDoById = useMemo(
    () => new Map(visibleToDo.map((entry) => [entry.item.id, entry])),
    [visibleToDo]
  );
  const orderedVisibleToDo = useMemo(() => {
    const hasSameIds =
      orderedVisibleIds.length === visibleIds.length &&
      orderedVisibleIds.every((id) => visibleToDoById.has(id));

    if (!hasSameIds) {
      return visibleToDo;
    }

    return sortToDoByPriority(
      orderedVisibleIds.map((id) => visibleToDoById.get(id)).filter(Boolean)
    );
  }, [orderedVisibleIds, visibleIds.length, visibleToDo, visibleToDoById]);

  useEffect(() => {
    if (isReorderingRef.current) {
      return;
    }

    orderedVisibleIdsRef.current = visibleIds;
    setOrderedVisibleIds(visibleIds);
  }, [visibleIds]);

  const handleReorder = useCallback((nextVisibleIds) => {
    isReorderingRef.current = true;
    orderedVisibleIdsRef.current = nextVisibleIds;
    setOrderedVisibleIds(nextVisibleIds);
  }, []);

  const handleReorderEnd = useCallback(() => {
    if (!isReorderingRef.current) {
      return;
    }

    reorderToDoItems(orderedVisibleIdsRef.current);
    isReorderingRef.current = false;
  }, [reorderToDoItems]);

  const clearPendingTouchDrag = useCallback(() => {
    if (touchDragTimeoutRef.current) {
      window.clearTimeout(touchDragTimeoutRef.current);
      touchDragTimeoutRef.current = null;
    }

    pendingTouchDragRef.current = null;
  }, []);

  const startDragging = useCallback((id) => {
    isReorderingRef.current = true;
    draggingItemIdRef.current = id;
    setDraggingItemId(id);
  }, []);

  const getNextOrderedIds = useCallback((pointerY) => {
    const draggingId = draggingItemIdRef.current;

    if (!draggingId) {
      return orderedVisibleIdsRef.current;
    }

    const idsWithoutDraggedItem = orderedVisibleIdsRef.current.filter(
      (id) => id !== draggingId
    );
    let insertIndex = idsWithoutDraggedItem.length;

    idsWithoutDraggedItem.some((id, index) => {
      const element = listRef.current?.querySelector(`[data-drag-id="${id}"]`);

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

      if (!draggingItemIdRef.current) {
        return;
      }

      if (event.pointerType === "touch") {
        event.preventDefault();
      }

      const nextOrderedIds = getNextOrderedIds(event.clientY);

      if (nextOrderedIds.join("|") !== orderedVisibleIdsRef.current.join("|")) {
        handleReorder(nextOrderedIds);
      }
    },
    [clearPendingTouchDrag, getNextOrderedIds, handleReorder]
  );

  const handlePointerUp = useCallback(() => {
    clearPendingTouchDrag();
    handleReorderEnd();
    draggingItemIdRef.current = null;
    setDraggingItemId(null);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
  }, [clearPendingTouchDrag, handlePointerMove, handleReorderEnd]);

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

      if (!draggingItemIdRef.current) {
        return;
      }

      event.preventDefault();
      const nextOrderedIds = getNextOrderedIds(touch.clientY);

      if (nextOrderedIds.join("|") !== orderedVisibleIdsRef.current.join("|")) {
        handleReorder(nextOrderedIds);
      }
    },
    [clearPendingTouchDrag, getNextOrderedIds, handleReorder]
  );

  const handleTouchEnd = useCallback(() => {
    clearPendingTouchDrag();
    handleReorderEnd();
    draggingItemIdRef.current = null;
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
    handlePointerMove,
    handlePointerUp,
    handleReorderEnd,
    handleTouchMove,
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

  const handlePointerDown = useCallback(
    (id, event) => {
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
          startY: event.clientY,
        };
        touchDragTimeoutRef.current = window.setTimeout(() => {
          if (pendingTouchDragRef.current?.id === id) {
            clearPendingTouchDrag();
            startDragging(id);
          }
        }, TOUCH_DRAG_DELAY);
        return;
      }

      event.preventDefault();
      startDragging(id);
    },
    [
      canDragItems,
      clearPendingTouchDrag,
      handlePointerMove,
      handlePointerUp,
      startDragging,
    ]
  );

  const handleTouchStart = useCallback(
    (id, event) => {
      const pendingTouchDrag = pendingTouchDragRef.current;

      if (!canDragItems || draggingItemIdRef.current) {
        return;
      }

      if (pendingTouchDrag && pendingTouchDrag.id !== id) {
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
        startY: touch.clientY,
      };
      touchDragTimeoutRef.current = window.setTimeout(() => {
        if (pendingTouchDragRef.current?.id === id) {
          clearPendingTouchDrag();
          startDragging(id);
        }
      }, TOUCH_DRAG_DELAY);
    },
    [
      canDragItems,
      clearPendingTouchDrag,
      handleTouchEnd,
      handleTouchMove,
      startDragging,
    ]
  );

  const handleCalendarDateClick = useCallback(
    (date) => {
      if (isDeadlineCalendarPicking) {
        setDeadline(buildDeadline(date, getDeadlineTime(deadline)));
        return;
      }

      setSelectedCalendarDate(date);
    },
    [deadline, isDeadlineCalendarPicking, setDeadline]
  );

  const handleDeleteCompletedForCalendarDay = useCallback(
    (itemIds, dateTitle) => {
      requestDeleteCompletedItems({ itemIds, dateTitle });
    },
    [requestDeleteCompletedItems]
  );

  const renderToDo = useMemo(() => {
    return orderedVisibleToDo.map(({ item, searchMatch }) => (
      <ToDoElement
        key={item.id}
        text={item.text}
        searchMatch={searchMatch}
        id={item.id}
        category={item.category}
        blockAnimation={blockAnimation}
        focus={focus}
        favorite={item.favorite}
        checked={item.checked}
        date={item.date}
        deadline={item.deadline}
        onClickFavorite={handleFavorite}
        onClickCheckBox={handleCheckBox}
        onClickEdit={handleEdit}
        onClickDelete={handleDelete}
        draggable={canDragItems}
        isDragging={draggingItemId === item.id}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
      />
    ));
  }, [
    canDragItems,
    draggingItemId,
    focus,
    handleFavorite,
    handleCheckBox,
    handleEdit,
    handleDelete,
    handlePointerDown,
    handleTouchStart,
    orderedVisibleToDo,
  ]);

  return (
    <div className={s.root} style={inputMaxHeight}>
      <Header
        count={viewMode === "calendar" ? calendarItems.length : renderToDo.length}
        columnItems={columnItems}
        setColumnItems={setColumnItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        onHeightChange={handleHeaderHeightChange}
      />
      <AnimatePresence mode="wait">
        <motion.div key={viewMode} className={s.view} {...viewAnimation}>
          {viewMode === "settings" ? (
            <SettingsView />
          ) : viewMode === "calendar" ? (
            <CalendarView
              focus={focus}
              items={calendarItems}
              onClickCheckBox={handleCheckBox}
              onClickDelete={handleDelete}
              onClickEdit={handleEdit}
              onClickFavorite={handleFavorite}
              onDeleteCompletedDay={handleDeleteCompletedForCalendarDay}
              onReorderItems={reorderToDoItems}
              isDeadlinePicking={isDeadlineCalendarPicking}
              searchQuery={searchQuery}
              selectedDeadlineDate={getDeadlineDate(deadline)}
              selectedDate={selectedCalendarDate}
              weekStart={weekStart}
              onDateClick={handleCalendarDateClick}
            />
          ) : renderToDo.length > 0 && canDragItems ? (
            <div
              ref={listRef}
              className={cn(s.toDoElements, { [s.columnItems]: columnItems })}
            >
              {renderToDo}
            </div>
          ) : (
            <div
              ref={listRef}
              className={cn(s.toDoElements, { [s.columnItems]: columnItems })}
            >
              <AnimatePresence>
                {renderToDo.length ? (
                  renderToDo
                ) : (
                  <motion.div className={s.emptyList} {...blockAnimation}>
                    {searchQuery.trim()
                      ? t("todo.noSearchResults")
                      : t("todo.addEmpty")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {viewMode !== "settings" && (
        <ToDoInput
          createdAt={viewMode === "calendar" ? selectedCalendarDate : undefined}
          isDeadlineCalendarPicking={isDeadlineCalendarPicking}
          onDeadlineCalendarPickCancel={closeDeadlinePicking}
          onDeadlinePickerOpenChange={setIsDeadlinePickerOpen}
          onDeadlineCalendarPickStart={
            viewMode === "calendar"
              ? () => setIsDeadlineCalendarPicking((prev) => !prev)
              : undefined
          }
          onAddItem={handleAddItem}
          textareaRef={textareaRef}
          setTextAreaHeight={setTextAreaHeight}
        />
      )}
    </div>
  );
}
