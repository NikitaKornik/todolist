import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import cn from "classnames";
import Btn from "../UIkit/Btn/Btn";
import s from "./ToDoElement.module.scss";
import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgHeart } from "../../image/heart.svg";
import { ReactComponent as SvgHeartFill } from "../../image/heartFill.svg";
import { ReactComponent as SvgCheckBoxActive } from "../../image/checkBoxActive.svg";
import { ReactComponent as SvgCheckBoxDisable } from "../../image/checkBoxDisable.svg";
import { formatDeadline } from "../../utils/deadline";
import { formatScheduledAt } from "../../utils/calendar";
import { useI18n } from "../../i18n/i18n";

const ToDoElementAnimation = {
  animate: {
    height: "auto",
    marginBottom: 12,
  },
  initial: { height: 0, marginBottom: 0 },
  exit: { height: 0, marginBottom: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

const ToDoElementLayoutTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightString(value, searchMatch) {
  if (!searchMatch?.value) {
    return value;
  }

  const regexp = new RegExp(`(${escapeRegExp(searchMatch.value)})`, "gi");
  const parts = value.split(regexp);

  if (parts.length === 1) {
    return value;
  }

  return parts.map((part, index) =>
    part.toLowerCase() === searchMatch.value.toLowerCase() ? (
      <mark className={s.searchHighlight} key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function highlightChildren(children, searchMatch) {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return highlightString(child, searchMatch);
    }

    return child;
  });
}

function getReactMarkdownComponents(searchMatch) {
  return {
    p: ({ node, children, ...props }) => (
      <p className={s.todoText} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </p>
    ),
    h1: ({ node, children, ...props }) => (
      <h1 className={s.todoTitle} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </h1>
    ),
    a: ({ node, children, ...props }) => (
      <a className={s.todoLink} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </a>
    ),
    img: ({ node, ...props }) => (
      <img alt="" className={s.todoImg} {...props} style={{ margin: 0 }} />
    ),
    blockquote: ({ node, children, ...props }) => (
      <blockquote className={s.todoBlockquote} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </blockquote>
    ),
  };
}

const ToDoElement = memo(
  ({
    text,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    category,
    favorite,
    id,
    focus,
    checked,
    onClickCheckBox,
    date,
    deadline,
    scheduledAt,
    searchMatch,
    draggable,
    isDragging,
    onPointerDown,
    onTouchStart,
  }) => {
    const animationProps = draggable ? {} : ToDoElementAnimation;
    const { categoryLabel, locale, t } = useI18n();

    return (
      <motion.div
        layout
        transition={{ layout: ToDoElementLayoutTransition }}
        className={cn(s.root, {
          [s.focus]: focus !== id && focus !== "",
          [s.favorite]: favorite,
          [s.checked]: checked,
          [s.draggable]: draggable,
          [s.dragging]: isDragging,
        })}
        data-drag-enabled={draggable}
        data-drag-id={id}
        id={id}
        onPointerDownCapture={(event) => onPointerDown?.(id, event)}
        onTouchStartCapture={(event) => onTouchStart?.(id, event)}
        data-testid={`todo-item-${text}`}
        {...animationProps}
      >
        <div className={s.card}>
          <div className={s.text}>
            <ReactMarkdown components={getReactMarkdownComponents(searchMatch)}>
              {text}
            </ReactMarkdown>
          </div>
          <div className={s.info}>
            <div className={s.category}>
              {category && `${t("category.label")}: ${categoryLabel(category)}`}
            </div>
            <div className={s.date}>{date && `${t("todo.created")}: ${date}`}</div>
            {scheduledAt && (
              <div className={s.date}>
                {t("todo.date")}: {formatScheduledAt(scheduledAt, locale)}
              </div>
            )}
          </div>
          {deadline && (
            <div className={s.deadline}>
              {t("deadline.label")}: {formatDeadline(deadline, new Date(), { locale, t })}
            </div>
          )}
          <div className={s.btnContainer}>
            <Btn
              variant={checked ? "checked" : "BGnone"}
              size={"size_svg"}
              svgRight={checked ? <SvgCheckBoxActive /> : <SvgCheckBoxDisable />}
              className={s.hover}
              ariaLabel={checked ? t("todo.unmarkDone") : t("todo.markDone")}
              onClick={() => onClickCheckBox(id)}
            ></Btn>
            <Btn
              variant={favorite ? "favorite" : "BGnone"}
              size={"size_svg"}
              svgRight={favorite ? <SvgHeartFill /> : <SvgHeart />}
              className={s.hover}
              ariaLabel={
                favorite ? t("todo.removeFromFavorite") : t("todo.addToFavorite")
              }
              onClick={() => onClickFavorite(id)}
            ></Btn>
            <Btn
              variant="BGnone"
              size={"size_svg"}
              className={s.hover}
              ariaLabel={focus !== id ? t("todo.edit") : t("todo.closeEdit")}
              onClick={() => onClickEdit(id, text, deadline, category)}
              svgRight={focus !== id ? <SvgEdit /> : <SvgCancel />}
            ></Btn>
            <Btn
              variant="danger"
              size={"size_svg"}
              svgRight={<SvgDelete />}
              className={s.hover}
              ariaLabel={t("todo.delete")}
              onClick={() => onClickDelete(id)}
            ></Btn>
          </div>
        </div>
      </motion.div>
    );
  }
);

export { ToDoElement };
