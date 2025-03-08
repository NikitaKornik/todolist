import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
// import cn from "classnames";

import s from "./ToDoContainer.module.scss";

import ToDoElement from "../ToDoElement/ToDoElement";
import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgAdd } from "../../image/add.svg";

const svgAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.1 },
};

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

const backGroundAnimation = {
  animate: { opacity: 1 },
  initial: { opacity: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoContainer() {
  const [input, setInput] = useState("");
  const [inputCash, setInputCash] = useState("");
  const [focus, setFocus] = useState("");
  const [popup, setPopup] = useState(false);
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
    setInput(inputCash);
    setInputCash("");
    setFocus("");
  }

  function cancel() {
    setInput(inputCash);
    setInputCash("");
    setFocus("");
  }

  function deleteElement(idItem) {
    setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
    setTimeout(() => {
      setPopup("");
    }, 50);
    if (idItem === focus) {
      setFocus("");
      setInput(inputCash);
      setInputCash("");
    }
  }

  function editElement(idItem, text) {
    setFocus(idItem);
    setInputCash(input);
    setInput(text);
  }

  return (
    <div
      className={s.root}
      style={{
        paddingBottom: textAreaHeight <= 350 ? `${textAreaHeight}px` : "370px",
      }}
    >
      <AnimatePresence>
        {popup && (
          <motion.div className={s.popup} {...backGroundAnimation}>
            <motion.div className={s.popupContainer} {...blockAnimation}>
              <div className={s.popupText}>
                Вы точно хотите удалить этот элемент?
              </div>
              <div className={s.popupBtnContainer}>
                <Btn
                  variant="BGprimary"
                  onClick={() => {
                    setPopup("");
                  }}
                >
                  Отмена
                </Btn>
                <Btn variant="BGdanger" onClick={() => deleteElement(popup)}>
                  Удалить
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
            variant={"BGprimary"}
            onClick={addItem}
            disabled={!input}
          >
            <AnimatePresence mode="wait">
              {focus !== "" ? (
                <SvgCheck src={SvgCheck} key="check" {...svgAnimation} />
              ) : (
                <SvgAdd src={SvgAdd} key="add" {...svgAnimation} />
              )}
            </AnimatePresence>
          </Btn>
          <AnimatePresence>
            {focus !== "" && popup !== true && (
              <Btn
                svgRight={<SvgCancel />}
                className={s.svgCancel}
                variant={"BGdanger"}
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
                onClickDelete={() => {
                  // setPopup(!popup);
                  setPopup(item.id);
                }}
                onClickEdit={() =>
                  focus !== item.id ? editElement(item.id, item.text) : cancel()
                }
                svgAnimation={svgAnimation}
                focus={focus}
              />
            );
          })
        ) : (
          <motion.div className={s.emptyList} {...blockAnimation}>
            Ваш список пуст, пора что-то добавить!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
