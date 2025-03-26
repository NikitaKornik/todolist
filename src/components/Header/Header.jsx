import React, { memo, useContext } from "react";
import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";
import {
  ProfileToDoContext,
  ThemesToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import s from "./Header.module.scss";

import { ReactComponent as SvgThreeColumn } from "../../image/threeColumn.svg";
import { ReactComponent as SvgThreeRow } from "../../image/threeRow.svg";
import Btn from "../UIkit/Btn/Btn";

const Header = memo(({ count, columnItems, setColumnItems }) => {
  console.log("3) Header");
  const { setTheme, theme, themesData } = useContext(ThemesToDoContext);
  const { profileData, profile, setProfile } = useContext(ProfileToDoContext);

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
        </div>
        <div className={s.rightItem}>
          <Btn
            variant={"BGnone"}
            // variant={checked ? "checked" : "BGnone"}
            size={"size_svg"}
            svgRight={columnItems ? <SvgThreeColumn /> : <SvgThreeRow />}
            // className={s.hover}
            onClick={() => setColumnItems(!columnItems)}
          ></Btn>
          <div className={s.count}>Заметок: {count}</div>
        </div>
      </div>
    </div>
  );
});

export { Header };
