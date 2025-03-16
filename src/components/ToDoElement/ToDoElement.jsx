import React from "react";
import { motion } from "framer-motion";
import cn from "classnames";

import Btn from "../UIkit/Btn/Btn";

import s from "./ToDoElement.module.scss";

import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgHeart } from "../../image/heart.svg";
import { ReactComponent as SvgHeartFill } from "../../image/heartFill.svg";

const ToDoElementAnimation = {
  animate: {
    height: "auto",
    minHeight: "24px",
    padding: "15px 0px 50px 0px",
    margin: "10px 0px",
  },
  initial: { height: 0, minHeight: 0, padding: 0, margin: 0 },
  exit: { height: 0, minHeight: 0, padding: 0, margin: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoElement({
  text,
  onClickEdit,
  onClickDelete,
  onClickFavorite,
  profile,
  favorite,
  id,
  focus,
}) {
  return (
    <motion.div
      className={cn(s.root, {
        [s.focus]: focus !== id && focus !== "",
        [s.favorite]: favorite,
      })}
      id={id}
      {...ToDoElementAnimation}
    >
      <div className={s.text}>{text}</div>
      <div className={s.profile}>{profile}</div>
      <Btn
        variant={favorite ? "secondary" : "BGnone"}
        svgRight={favorite ? <SvgHeartFill /> : <SvgHeart />}
        className={cn(s.svgHeart, s.hover)}
        onClick={onClickFavorite}
      ></Btn>
      <Btn
        variant="BGnone"
        className={cn(s.svgEdit, s.hover)}
        onClick={onClickEdit}
        svgRight={focus !== id ? <SvgEdit /> : <SvgCancel />}
      ></Btn>
      <Btn
        variant="danger"
        svgRight={<SvgDelete />}
        className={cn(s.svgDelete, s.hover)}
        onClick={onClickDelete}
      ></Btn>
    </motion.div>
  );
}
