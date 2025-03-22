import { useContext, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { FunctionContext } from "./context/ToDoProvider/ToDoProvider";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";
import PopupMenu from "./components/PopupMenu/PopupMenu";
import Btn from "./components/UIkit/Btn/Btn";
import s from "./App.module.scss";

function App() {
  const { popup, deleteElement, theme, themesData } =
    useContext(FunctionContext);

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.toggle(s[themesData[theme].class]);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={s.root}>
      <AnimatePresence>
        {popup && (
          <PopupMenu
            title={"Вы точно хотите удалить этот элемент?"}
            desc={"Удалив элемент, вы больше не можете его восстановить!"}
            closeBtn={true}
          >
            <Btn
              variant="BGdanger"
              onClick={() => {
                deleteElement(popup);
              }}
            >
              Удалить
            </Btn>
          </PopupMenu>
        )}
      </AnimatePresence>
      <ToDoContainer />
    </div>
  );
}

export default App;
