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
  ToDoContext,
  ProfileToDoContext,
  ElementsToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import { Header } from "../Header/Header";
import { ToDoElement } from "../ToDoElement/ToDoElement";
import { ToDoInput } from "../ToDoInput/ToDoInput";
import s from "./ToDoContainer.module.scss";
import { findNoteSearchMatch } from "../../utils/noteSearch";

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoContainer() {
  const textareaRef = useRef(null);
  const listRef = useRef(null);

  const [columnItems, setColumnItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [orderedVisibleIds, setOrderedVisibleIds] = useState([]);
  const orderedVisibleIdsRef = useRef([]);
  const draggingItemIdRef = useRef(null);
  const isReorderingRef = useRef(false);

  const { focus, popup, toDoItems } = useContext(ToDoContext);
  const { profileData, profile } = useContext(ProfileToDoContext);
  const { addItem, reorderToDoItems } = useContext(FunctionToDoContext);
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
    (id, text) => onClickEdit({ id, text }),
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
      paddingBottom: textAreaHeight <= 400 ? `${textAreaHeight}px` : "420px",
    }),
    [textAreaHeight]
  );

  useEffect(() => {
    if (toDoItems.length > 0) {
      localStorage.setItem("toDoItems", JSON.stringify(toDoItems));
    } else {
      localStorage.removeItem("toDoItems");
    }
  }, [toDoItems]);

  useEffect(() => {
    const handleKeyDown = (key) => {
      if (key.key === "Escape") {
        if (!popup && focus !== "") {
          cancel();
        }
      }
      if (key.key === "Enter" && !key.shiftKey) {
        if (!popup) {
          key.preventDefault();
          addItem();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [popup, focus, cancel, addItem]);

  const filteredToDo = useMemo(() => {
    const profileFilteredToDo =
      profile === 0
        ? toDoItems
        : toDoItems.filter((item) => {
            const selectedProfile = profileData.find(
              (profileItem) => profileItem.id === profile
            );

            return (
              item.profile === selectedProfile?.name || item.favorite === true
            );
          });

    const trimmedSearchQuery = searchQuery.trim();

    if (!trimmedSearchQuery) {
      return profileFilteredToDo.map((item) => ({
        item,
        searchMatch: null,
      }));
    }

    return profileFilteredToDo
      .map((item) => ({
        item,
        searchMatch: findNoteSearchMatch(item.text, trimmedSearchQuery),
      }))
      .filter(({ searchMatch }) => Boolean(searchMatch));
  }, [toDoItems, profile, profileData, searchQuery]);

  const visibleToDo = useMemo(() => [...filteredToDo].reverse(), [filteredToDo]);
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

    return orderedVisibleIds
      .map((id) => visibleToDoById.get(id))
      .filter(Boolean);
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
      if (!draggingItemIdRef.current) {
        return;
      }

      const nextOrderedIds = getNextOrderedIds(event.clientY);

      if (nextOrderedIds.join("|") !== orderedVisibleIdsRef.current.join("|")) {
        handleReorder(nextOrderedIds);
      }
    },
    [getNextOrderedIds, handleReorder]
  );

  const handlePointerUp = useCallback(() => {
    handleReorderEnd();
    draggingItemIdRef.current = null;
    setDraggingItemId(null);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseup", handlePointerUp);
  }, [handlePointerMove, handleReorderEnd]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handlePointerDown = useCallback(
    (id, event) => {
      if (!canDragItems || draggingItemIdRef.current || event.button !== 0) {
        return;
      }

      if (event.target.closest("button, a, input, textarea")) {
        return;
      }

      event.preventDefault();
      isReorderingRef.current = true;
      draggingItemIdRef.current = id;
      setDraggingItemId(id);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    },
    [canDragItems, handlePointerMove, handlePointerUp]
  );

  const renderToDo = useMemo(() => {
    return orderedVisibleToDo.map(({ item, searchMatch }) => (
      <ToDoElement
        key={item.id}
        text={item.text}
        searchMatch={searchMatch}
        id={item.id}
        profile={item.profile}
        blockAnimation={blockAnimation}
        focus={focus}
        favorite={item.favorite}
        checked={item.checked}
        date={item.date}
        onClickFavorite={handleFavorite}
        onClickCheckBox={handleCheckBox}
        onClickEdit={handleEdit}
        onClickDelete={handleDelete}
        draggable={canDragItems}
        isDragging={draggingItemId === item.id}
        onPointerDown={handlePointerDown}
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
    orderedVisibleToDo,
  ]);

  return (
    <div className={s.root} style={inputMaxHeight}>
      <Header
        count={renderToDo.length}
        columnItems={columnItems}
        setColumnItems={setColumnItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {renderToDo.length > 0 && canDragItems ? (
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
                  ? "Ничего не найдено"
                  : "Ваш список пуст, пора что-то добавить!"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <ToDoInput
        textareaRef={textareaRef}
        setTextAreaHeight={setTextAreaHeight}
      />
    </div>
  );
}
