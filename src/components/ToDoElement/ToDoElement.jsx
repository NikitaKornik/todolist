import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import cn from "classnames";

import s from "./ToDoElement.module.scss";

import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
// import SvgEdit from "../../image/edit.svg";
// import SvgCancel from "../../image/cancel.svg";

// const MotionSvgEdit = motion.img;
// const MotionSvgCancel = motion.img;

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
      <Btn
        variant="BGnone"
        className={cn(s.svgEdit, s.hover)}
        onClick={onClickEdit}
      >
        <AnimatePresence mode="wait">
          {/* {focus !== id ? (
            <MotionSvgEdit key="edit" src={SvgEdit} {...svgAnimation} />
          ) : (
            <MotionSvgEdit key="cancel" src={SvgCancel} {...svgAnimation} />
          )} */}
          {focus !== id ? (
            <SvgEdit key="edit" src={SvgEdit} {...svgAnimation} />
          ) : (
            <SvgCancel key="cancel" src={SvgCancel} {...svgAnimation} />
          )}
        </AnimatePresence>
      </Btn>
      <Btn
        variant="danger"
        svgRight={<SvgDelete />}
        className={cn(s.svgDelete, s.hover)}
        onClick={onClickDelete}
      ></Btn>
    </motion.div>
  );
}
