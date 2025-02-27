import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import s from "./ToDoContainer.module.scss";

import ToDoElement from "../ToDoElement/ToDoElement";
import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import SvgAdd from "../../image/add.svg";
import SvgCheck from "../../image/check.svg";

const MotionSvgAdd = motion.img;
const MotionSvgCheck = motion.img;

const svgAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.1 },
};

export default function ToDoContainer() {
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState("");
  const [textAreaHeight, setTextAreaHeight] = useState([]);

  const [toDoItems, setToDoItems] = useState(() => {
    const savedItems = localStorage.getItem("toDoItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  useEffect(() => {
    if (toDoItems.length > 0) {
      localStorage.setItem("toDoItems", JSON.stringify(toDoItems));
    } else {
      localStorage.removeItem("toDoItems");
    }
  }, [toDoItems]);

  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    setTextAreaHeight(textarea.scrollHeight + 50);
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  function addItem() {
    if (focus === "") {
      if (input.trim()) {
        setToDoItems((prev) => [...prev, { id: uuidv4(), text: input }]);
      }
    } else {
      setToDoItems((prev) =>
        prev.map((item) =>
          item.id === focus ? { ...item, text: input } : item
        )
      );
    }
    setInput("");
    setFocus("");
  }

  function cancel() {
    setInput("");
    setFocus("");
  }

  function deleteElement(idItem) {
    setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
    if (idItem === focus) {
      setFocus("");
      setInput("");
    }
  }

  function editElement(idItem, text) {
    setFocus(idItem);
    setInput(text);
  }

  return (
    <div
      className={s.root}
      style={{
        paddingTop: textAreaHeight <= 350 ? `${textAreaHeight}px` : "370px",
      }}
    >
      <div className={s.inputContainer}>
        <div className={s.input}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            rows={1}
            placeholder="Введите текст..."
          />
          <Btn
            className={s.svgAdd}
            variant={"primary"}
            onClick={addItem}
            disabled={!input}
          >
            <AnimatePresence mode="wait">
              {focus !== "" ? (
                <MotionSvgCheck src={SvgCheck} key="check" {...svgAnimation} />
              ) : (
                <MotionSvgAdd src={SvgAdd} key="add" {...svgAnimation} />
              )}
            </AnimatePresence>
          </Btn>
          <AnimatePresence>
            {focus !== "" && (
              <Btn
                svgRight={<SvgCancel />}
                className={s.svgCancel}
                variant={"danger"}
                onClick={cancel}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {toDoItems.length ? (
          toDoItems.map((item) => {
            return (
              <ToDoElement
                key={item.id}
                text={item.text}
                id={item.id}
                onClickDelete={() => deleteElement(item.id)}
                onClickEdit={() =>
                  focus !== item.id ? editElement(item.id, item.text) : cancel()
                }
                svgAnimation={svgAnimation}
                focus={focus}
              />
            );
          })
        ) : (
          <motion.div
            className={s.emptyList}
            animate={{ scale: 1 }}
            initial={{ scale: 0 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            Ваш список пуст, пора что-то добавить!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
