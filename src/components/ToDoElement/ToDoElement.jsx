import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import cn from "classnames";
import s from "./ToDoElement.module.scss";
import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";

const MotionSvgEdit = motion(SvgEdit);
const MotionSvgCancel = motion(SvgCancel);

export default function ToDoElement({
  text,
  onClickEdit,
  onClickDelete,
  id,
  focus,
  svgAnimation,
}) {
  return (
    <motion.div
      className={cn(s.root, { [s.focus]: focus !== id && focus !== "" })}
      id={id}
      animate={{ scale: 1 }}
      initial={{ scale: 0 }}
      exit={{ scale: 0 }}
    >
      <div className={s.text}>{text}</div>
      <Btn variant="secondary" className={s.svgEdit} onClick={onClickEdit}>
        <AnimatePresence mode="wait">
          {focus !== id ? (
            <MotionSvgEdit key="edit" {...svgAnimation} />
          ) : (
            <MotionSvgCancel key="cancel" {...svgAnimation} />
          )}
        </AnimatePresence>
      </Btn>
      <Btn
        variant="danger"
        svgRight={<SvgDelete />}
        className={s.svgDelete}
        onClick={onClickDelete}
      ></Btn>
    </motion.div>
  );
}
