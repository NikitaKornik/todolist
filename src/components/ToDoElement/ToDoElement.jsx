import React from "react";
import { motion } from "framer-motion";
import cn from "classnames";

import s from "./ToDoElement.module.scss";

import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgHeart } from "../../image/heart.svg";
import { ReactComponent as SvgHeartFill } from "../../image/heartFill.svg";

export default function ToDoElement({
  text,
  onClickEdit,
  onClickDelete,
  onClickFavorite,
  blockAnimation,
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
      {...blockAnimation}
    >
      <div className={s.text}>{text}</div>
      <Btn
        variant="secondary"
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
