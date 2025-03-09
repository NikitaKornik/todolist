import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import Btn from "../UIkit/Btn/Btn";

import s from "./ToDoInput.module.scss";

import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgAdd } from "../../image/add.svg";

function ToDoInput({
  input,
  setInput,
  addItem,
  textareaRef,
  popup,
  cancel,
  focus,
  setTextAreaHeight,
}) {
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
  return (
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
          svgRight={focus !== "" ? <SvgCheck /> : <SvgAdd />}
        ></Btn>
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
  );
}

export default ToDoInput;
