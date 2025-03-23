import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  InputToDoContext,
  FunctionToDoContext,
  ToDoContext,
  ProfileToDoContext,
  ElementsToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import { Header } from "../Header/Header";
import { ToDoElement } from "../ToDoElement/ToDoElement";
import { ToDoInput } from "../ToDoInput/ToDoInput";
import s from "./ToDoContainer.module.scss";

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoContainer() {
  console.log("2) ToDoContainer");
  const textareaRef = useRef(null);

  const { focus, popup, toDoItems } = useContext(ToDoContext);
  const { profileData, profile } = useContext(ProfileToDoContext);
  const { setPopup, addItem } = useContext(FunctionToDoContext);
  const {
    deleteElement,
    cancel,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    onClickCheckBox,
  } = useContext(ElementsToDoContext);
  const { input } = useContext(InputToDoContext);

  const handleFavorite = useCallback(
    (item) => onClickFavorite(item),
    [onClickFavorite]
  );
  const handleCheckBox = useCallback(
    (item) => onClickCheckBox(item),
    [onClickCheckBox]
  );
  const handleEdit = useCallback((item) => onClickEdit(item), [onClickEdit]);
  const handleDelete = useCallback(
    (item) => onClickDelete(item),
    [onClickDelete]
  );

  const [textAreaHeight, setTextAreaHeight] = useState([]);

  const inputMaxHeight = {
    paddingBottom: textAreaHeight <= 350 ? `${textAreaHeight}px` : "370px",
  };

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
        if (popup) {
          setPopup("");
        }
        if (focus !== "") {
          cancel();
        }
      }
      if (key.key === "Enter" && !key.shiftKey) {
        if (popup) {
          deleteElement(popup);
        } else {
          key.preventDefault();
          addItem();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [popup, focus, input]);

  const filteredToDo = useMemo(() => {
    return profile === 0
      ? toDoItems
      : toDoItems.filter(
          (item) =>
            item.profile === profileData[profile].name || item.favorite === true
        );
  }, [toDoItems, profile, profileData]);
  const renderToDo = useMemo(() => {
    return filteredToDo.toReversed().map((item) => (
      <ToDoElement
        key={item.id}
        text={item.text}
        id={item.id}
        profile={item.profile}
        blockAnimation={blockAnimation}
        focus={focus}
        favorite={item.favorite}
        checked={item.checked}
        date={item.date}
        onClickFavorite={() => handleFavorite(item)}
        onClickCheckBox={() => handleCheckBox(item)}
        onClickEdit={() => {
          handleEdit(item);
        }}
        onClickDelete={() => handleDelete(item)}
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
      <Header count={renderToDo.length} />
      <ToDoInput
        textareaRef={textareaRef}
        setTextAreaHeight={setTextAreaHeight}
      />
      <AnimatePresence>
        {renderToDo.length ? (
          renderToDo
        ) : (
          <motion.div className={s.emptyList} {...blockAnimation}>
            Ваш список пуст, пора что-то добавить!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
