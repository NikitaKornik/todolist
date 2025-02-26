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
      <Btn
        variant="secondary"
        svgRight={
          focus !== id ? (
            <MotionSvgEdit
              animate={{ scale: 1 }}
              initial={{ scale: 0 }}
              exit={{ scale: 0 }}
            />
          ) : (
            <MotionSvgCancel
              animate={{ scale: 1 }}
              initial={{ scale: 0 }}
              exit={{ scale: 0 }}
            />
          )
        }
        className={s.svgEdit}
        onClick={onClickEdit}
      />
      <Btn
        variant="danger"
        svgRight={<SvgDelete />}
        className={s.svgDelete}
        onClick={onClickDelete}
      />
    </motion.div>
  );
}
