import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
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

  const [columnItems, setColumnItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { focus, popup, toDoItems } = useContext(ToDoContext);
  const { profileData, profile } = useContext(ProfileToDoContext);
  const { addItem } = useContext(FunctionToDoContext);
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

  const renderToDo = useMemo(() => {
    return [...filteredToDo].reverse().map(({ item, searchMatch }) => (
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
      />
    ));
  }, [
    filteredToDo,
    focus,
    handleFavorite,
    handleCheckBox,
    handleEdit,
    handleDelete,
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
      <div className={cn(s.toDoElements, { [s.columnItems]: columnItems })}>
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
      <ToDoInput
        textareaRef={textareaRef}
        setTextAreaHeight={setTextAreaHeight}
      />
    </div>
  );
}
