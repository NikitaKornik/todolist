import React, { memo, useContext } from "react";
import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";
import {
  FunctionToDoContext,
  ProfileToDoContext,
  ThemesToDoContext,
  ToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import s from "./Header.module.scss";

import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgThreeColumn } from "../../image/threeColumn.svg";
import { ReactComponent as SvgThreeRow } from "../../image/threeRow.svg";
import Btn from "../UIkit/Btn/Btn";

const Header = memo(
  ({ count, columnItems, searchQuery, setColumnItems, setSearchQuery }) => {
    const { toDoItems } = useContext(ToDoContext);
    const { requestDeleteCompletedItems } = useContext(FunctionToDoContext);
    const { setTheme, theme, themesData } = useContext(ThemesToDoContext);
    const { profileData, profile, setProfile } = useContext(ProfileToDoContext);
    const completedCount = toDoItems.filter((item) => item.checked).length;

    return (
      <div className={s.root}>
        <div className={s.container}>
          <div className={s.leftItems}>
            <DropDownMenu
              data={profileData}
              item={profile}
              setItem={setProfile}
              editable
            />
            <DropDownMenu data={themesData} item={theme} setItem={setTheme} />
            <input
              aria-label="Поиск заметок"
              className={s.searchInput}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск заметок"
            />
          </div>
          <div className={s.rightItem}>
            <Btn
              className={s.completedBtn}
              variant="BGnone"
              svgLeft={<SvgDelete />}
              ariaLabel="Удалить выполненные"
              disabled={completedCount === 0}
              onClick={requestDeleteCompletedItems}
            >
              Выполненные
            </Btn>
            <Btn
              variant={"BGnone"}
              // variant={checked ? "checked" : "BGnone"}
              size={"size_svg"}
              svgRight={columnItems ? <SvgThreeColumn /> : <SvgThreeRow />}
              // className={s.hover}
              ariaLabel={columnItems ? "Показать одной колонкой" : "Показать двумя колонками"}
              onClick={() => setColumnItems(!columnItems)}
            ></Btn>
            <div className={s.count}>Заметок: {count}</div>
          </div>
        </div>
      </div>
    );
  }
);

export { Header };
