import React, {
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";
import {
  AuthToDoContext,
  FunctionToDoContext,
  CategoryToDoContext,
  ToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import s from "./Header.module.scss";

import { ReactComponent as SvgAlignJustify } from "../../image/align-justify.svg";
import { ReactComponent as SvgCalendarNote } from "../../image/calendar-note.svg";
import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgSearch } from "../../image/search.svg";
import { ReactComponent as SvgSettings } from "../../image/settings.svg";
import { ReactComponent as SvgThreeColumn } from "../../image/threeColumn.svg";
import { ReactComponent as SvgThreeRow } from "../../image/threeRow.svg";
import { ReactComponent as SvgUser } from "../../image/user.svg";
import Btn from "../UIkit/Btn/Btn";
import { SegmentedControl } from "../UIkit/SegmentedControl/SegmentedControl";
import { useI18n } from "../../i18n/i18n";

const Header = memo(
  ({
    count,
    columnItems,
    searchQuery,
    setColumnItems,
    setSearchQuery,
    viewMode,
    setViewMode,
    onHeightChange,
  }) => {
    const rootRef = useRef(null);
    const accountRef = useRef(null);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const { toDoItems } = useContext(ToDoContext);
    const { currentAccount, signOut } = useContext(AuthToDoContext);
    const { requestDeleteCompletedItems } = useContext(FunctionToDoContext);
    const { categoryData, category, setCategory } = useContext(CategoryToDoContext);
    const { categoryLabel, t } = useI18n();
    const completedCount = toDoItems.filter((item) => item.checked).length;
    const viewOptions = [
      {
        value: "list",
        label: t("header.list"),
        icon: <SvgAlignJustify />,
        ariaLabel: t("header.openList"),
      },
      {
        value: "calendar",
        label: t("header.calendar"),
        icon: <SvgCalendarNote />,
        ariaLabel: t("header.openCalendar"),
      },
    ];

    useLayoutEffect(() => {
      const root = rootRef.current;

      if (!root) {
        return undefined;
      }

      const updateHeight = () => {
        const fixedTop = parseFloat(window.getComputedStyle(root).top) || 0;
        const headerGap = window.innerWidth <= 900 ? 10 : 12;
        onHeightChange?.(Math.ceil(root.offsetHeight + fixedTop + headerGap));
      };

      updateHeight();

      if (typeof ResizeObserver === "undefined") {
        return undefined;
      }

      const observer = new ResizeObserver(updateHeight);
      observer.observe(root);

      return () => observer.disconnect();
    }, [onHeightChange]);

    useEffect(() => {
      function handleClickOutside(event) {
        if (
          accountRef.current &&
          !accountRef.current.contains(event.target)
        ) {
          setAccountMenuOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div className={s.root} ref={rootRef}>
        <div className={s.container}>
          <div className={s.headerGrid}>
            <div className={s.topControls}>
              <DropDownMenu
                data={categoryData}
                getItemLabel={categoryLabel}
                item={category}
                setItem={setCategory}
                editable
              />
              <label className={s.searchControl}>
                <SvgSearch aria-hidden="true" />
                <input
                  aria-label={t("header.search")}
                  className={s.searchInput}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("header.search")}
                />
              </label>
              {currentAccount && (
                <div className={s.accountMenu} ref={accountRef}>
                  <Btn
                    active={accountMenuOpen}
                    animate={false}
                    ariaLabel={t("header.openAccountMenu", {
                      username: currentAccount.username,
                    })}
                    className={s.accountTrigger}
                    size="size36"
                    svgRight={<SvgUser />}
                    variant="ghost"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                  />
                  {accountMenuOpen && (
                    <div className={s.accountDropdown}>
                      <div
                        className={s.accountDropdownName}
                        aria-label={t("auth.accountLabel", {
                          username: currentAccount.username,
                        })}
                      >
                        {currentAccount.username}
                      </div>
                      <Btn
                        animate={false}
                        ariaLabel={t("auth.signOut")}
                        className={s.accountDropdownBtn}
                        variant="ghost"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          signOut();
                        }}
                      >
                        {t("auth.signOut")}
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={s.bottomControls}>
              <SegmentedControl
                ariaLabel={t("header.viewMode")}
                className={s.viewSwitch}
                options={viewOptions}
                value={viewMode}
                onChange={setViewMode}
              />
              <div className={s.count} aria-label={t("header.count", { count })}>
                <span className={s.countFull}>{t("header.count", { count })}</span>
                <span className={s.countShort}>{count}</span>
              </div>
              <div className={s.actionControls}>
                <Btn
                  className={s.completedBtn}
                  variant="dangerGhost"
                  svgLeft={<SvgDelete />}
                  ariaLabel={t("header.deleteCompleted")}
                  animate={false}
                  collapseLabelOnMobile
                  disabled={completedCount === 0}
                  onClick={requestDeleteCompletedItems}
                >
                  {t("header.completed")}
                </Btn>
                <Btn
                  className={s.iconBtn}
                  variant="ghost"
                  size="size36"
                  svgRight={columnItems ? <SvgThreeColumn /> : <SvgThreeRow />}
                  animate={false}
                  ariaLabel={columnItems ? t("header.showRows") : t("header.showColumns")}
                  onClick={() => setColumnItems(!columnItems)}
                />
                <Btn
                  ariaLabel={
                    viewMode === "settings"
                      ? t("actions.back")
                      : t("header.openSettings")
                  }
                  active={viewMode === "settings"}
                  animate={false}
                  className={s.iconBtn}
                  size="size36"
                  svgRight={<SvgSettings />}
                  variant="ghost"
                  onClick={() => setViewMode("settings")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export { Header };
