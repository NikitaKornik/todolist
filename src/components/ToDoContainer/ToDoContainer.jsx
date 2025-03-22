import React, { useState, useRef, useEffect, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FunctionContext } from "../../context/ToDoProvider/ToDoProvider";
import Header from "../Header/Header";
import ToDoElement from "../ToDoElement/ToDoElement";
import ToDoInput from "../ToDoInput/ToDoInput";
import s from "./ToDoContainer.module.scss";

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoContainer() {
  console.log("ToDoContainer");
  const textareaRef = useRef(null);

  const {
    profileData,
    input,
    focus,
    popup,
    setPopup,
    profile,
    toDoItems,
    addItem,
    deleteElement,
    cancel,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    onClickCheckBox,
  } = useContext(FunctionContext);

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

  const filteredToDo =
    profile === 0
      ? toDoItems
      : toDoItems.filter(
          (item) =>
            item.profile === profileData[profile].name || item.favorite === true
        );
  const renderToDo = filteredToDo
    .toReversed()
    .map((item) => (
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
        onClickFavorite={() => onClickFavorite(item)}
        onClickCheckBox={() => onClickCheckBox(item)}
        onClickEdit={() => onClickEdit(item)}
        onClickDelete={() => onClickDelete(item)}
      />
    ));

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
