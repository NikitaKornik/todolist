import React, { memo, useCallback, useContext, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  InputToDoContext,
  FunctionToDoContext,
  ToDoContext,
  ElementsToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import Btn from "../UIkit/Btn/Btn";
import s from "./ToDoInput.module.scss";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgAdd } from "../../image/add.svg";

const ToDoInput = memo(({ textareaRef, setTextAreaHeight }) => {
  const { focus, popup } = useContext(ToDoContext);
  const { addItem } = useContext(FunctionToDoContext);
  const { cancel } = useContext(ElementsToDoContext);
  const { input, setInput } = useContext(InputToDoContext);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      setTextAreaHeight(textarea.scrollHeight + 100);
    }
  }, [textareaRef, setTextAreaHeight]);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);
  return (
    <div className={s.inputContainer}>
      <div className={s.input}>
        <textarea
          aria-label="Текст заметки"
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          rows={1}
          placeholder="Введите текст..."
        />
        <div className={s.inputBottom}>
          <div className={s.Btns}>
            <AnimatePresence>
              {focus !== "" && !popup && (
                <Btn
                  size={"size36"}
                  round={true}
                  svgRight={<SvgCancel />}
                  variant={"BGdanger"}
                  ariaLabel="Отменить редактирование"
                  onClick={cancel}
                ></Btn>
              )}
            </AnimatePresence>
            <Btn
              size={"size36"}
              round={true}
              onClick={addItem}
              disabled={!input.trim()}
              ariaLabel={focus !== "" ? "Сохранить заметку" : "Добавить заметку"}
              svgRight={focus !== "" ? <SvgCheck /> : <SvgAdd />}
            ></Btn>
          </div>
        </div>
      </div>
    </div>
  );
});

export { ToDoInput };
