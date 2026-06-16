import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import cn from "classnames";
import { motion, AnimatePresence } from "framer-motion";

import Btn from "../Btn/Btn";
import s from "./DropDownMenu.module.scss";

import { ReactComponent as ChevronDown } from "../../../image/chevronDown.svg";
import { ReactComponent as ChevronUp } from "../../../image/chevronUp.svg";
import { ReactComponent as SvgSearch } from "../../../image/search.svg";
import {
  FunctionToDoContext,
  CategoryToDoContext,
} from "../../../context/ToDoProvider/ToDoProvider";
import { useI18n } from "../../../i18n/i18n";

const dropDownAnimation = {
  animate: { height: "auto" },
  initial: { height: 0 },
  exit: { height: 0 },
  transition: { duration: 0.2 },
};

function DropDownMenu({
  className,
  data,
  direction = "down",
  categoryTarget = "current",
  item,
  setItem,
  editable = false,
  getItemLabel,
  triggerAriaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("createdAt");
  const dropdownRef = useRef(null);
  const selectedItem = data.find((listItem) => listItem.id === item) || data[0];
  const { t } = useI18n();

  const { setPopup } = useContext(FunctionToDoContext);
  const { deleteCategory } = useContext(CategoryToDoContext);
  const getLabel = (listItem) =>
    getItemLabel ? getItemLabel(listItem.name) : listItem.name;

  const visibleItems = useMemo(() => {
    const baseItems = data.filter((listItem) =>
      listItem.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const defaultItems = baseItems.filter((listItem) => !listItem.deletable);
    const customItems = baseItems.filter((listItem) => listItem.deletable);
    const sortedCustomItems = [...customItems].sort((first, second) => {
      if (sortMode === "name") {
        return first.name.localeCompare(second.name);
      }

      return (second.createdAt || 0) - (first.createdAt || 0);
    });

    return editable ? [...defaultItems, ...sortedCustomItems] : baseItems;
  }, [data, editable, search, sortMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function addCategory() {
    setPopup({
      type: "addCategory",
      categoryTarget,
      initialName: search.trim(),
    });
    setOpen(false);
  }

  return (
    <div className={cn(s.root, className)} ref={dropdownRef}>
      <Btn
        className={s.listItem}
        ariaLabel={
          triggerAriaLabel ||
          t("dropdown.openList", { name: getLabel(selectedItem) })
        }
        onClick={() => setOpen((prev) => !prev)}
        svgRight={
          open ? <ChevronUp width={"15px"} /> : <ChevronDown width={"15px"} />
        }
      >
        {getLabel(selectedItem)}
      </Btn>
      <AnimatePresence>
        {open && (
          <motion.ul
            className={cn(s.dropdownMenu, {
              [s.dropdownMenuUp]: direction === "up",
            })}
            {...dropDownAnimation}
          >
            {editable && (
              <li className={s.filterTools} role="presentation">
                <label className={s.searchControl}>
                  <SvgSearch aria-hidden="true" />
                  <input
                    aria-label={t("dropdown.searchFilters")}
                    className={s.searchInput}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    placeholder={t("dropdown.search")}
                  />
                </label>
                <button
                  aria-label={
                    sortMode === "createdAt"
                      ? t("dropdown.sortFiltersByName")
                      : t("dropdown.sortFiltersByCreatedAt")
                  }
                  className={s.sortButton}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSortMode((prev) =>
                      prev === "createdAt" ? "name" : "createdAt"
                    );
                  }}
                >
                  {sortMode === "createdAt"
                    ? t("dropdown.sortByCreatedAt")
                    : t("dropdown.sortByName")}
                </button>
              </li>
            )}
            {visibleItems.map((listItem) => {
              return (
                <li
                  key={listItem.id}
                  className={s.dropdownItem}
                  onClick={() => {
                    setItem(listItem.id);
                    setOpen(false);
                  }}
                >
                  <span className={s.itemName}>{getLabel(listItem)}</span>
                  {editable && listItem.deletable && (
                    <button
                      aria-label={t("dropdown.deleteFilter", {
                        name: listItem.name,
                      })}
                      className={s.deleteItem}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCategory(listItem.id);
                      }}
                    >
                    </button>
                  )}
                </li>
              );
            })}
            {editable && (
              <li className={s.editable} onClick={() => addCategory()}>
                {t("category.addItem")}
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropDownMenu;
