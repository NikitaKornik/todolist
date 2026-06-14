import { useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  FunctionToDoContext,
  ProfileToDoContext,
  ThemesToDoContext,
  ToDoContext,
} from "./context/ToDoProvider/ToDoProvider";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";
import PopupMenu from "./components/PopupMenu/PopupMenu";
import Btn from "./components/UIkit/Btn/Btn";
import s from "./App.module.scss";

const PROFILE_NAME_LIMIT = 32;

function AddProfilePopup({ initialName = "", onAddProfile, onClose, profileData }) {
  const [profileName, setProfileName] = useState(
    initialName.slice(0, PROFILE_NAME_LIMIT)
  );
  const normalizedName = profileName.trim().toLowerCase();
  const isDuplicate = profileData.some(
    (profileItem) => profileItem.name.toLowerCase() === normalizedName
  );
  const canSubmit = normalizedName.length > 0 && !isDuplicate;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (onAddProfile(profileName)) {
      onClose();
    }
  }

  return (
    <form className={s.popupForm} onSubmit={handleSubmit}>
      <h3 className={s.popupTitle}>Добавить профиль</h3>
      <label className={s.popupLabel}>
        Название профиля
        <input
          aria-label="Название профиля"
          className={s.popupInput}
          value={profileName}
          onChange={(event) =>
            setProfileName(event.target.value.slice(0, PROFILE_NAME_LIMIT))
          }
          maxLength={PROFILE_NAME_LIMIT}
          placeholder="Например: errands"
          autoFocus
        />
        <span className={s.popupCounter}>
          {profileName.length}/{PROFILE_NAME_LIMIT}
        </span>
        {isDuplicate && (
          <span className={s.popupError}>Такая категория уже существует</span>
        )}
      </label>
      <div className={s.popupBtns}>
        <Btn
          type="submit"
          variant="BGsecondary"
          ariaLabel="Добавить профиль"
          disabled={!canSubmit}
        >
          Добавить
        </Btn>
        <Btn variant="BGprimary" ariaLabel="Отменить добавление профиля" onClick={onClose}>
          Отмена
        </Btn>
      </div>
    </form>
  );
}

function App() {
  const { popup } = useContext(ToDoContext);
  const { addProfile, deleteCompletedItems, deleteElement, setPopup } =
    useContext(FunctionToDoContext);
  const { deleteProfile, profileData } = useContext(ProfileToDoContext);
  const { theme, themesData } = useContext(ThemesToDoContext);

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.toggle(s[themesData[theme].class]);
    localStorage.setItem("theme", theme);
  }, [theme, themesData]);

  useEffect(() => {
    if (!popup) {
      return undefined;
    }

    function handlePopupKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPopup(null);
      }

      if (event.key === "Enter" && popup.type === "delete") {
        event.preventDefault();
        deleteElement(popup.itemId);
      }

      if (event.key === "Enter" && popup.type === "deleteProfile") {
        event.preventDefault();
        deleteProfile(popup.profileId, { force: true });
      }

      if (event.key === "Enter" && popup.type === "deleteCompleted") {
        event.preventDefault();
        deleteCompletedItems();
      }
    }

    window.addEventListener("keydown", handlePopupKeyDown);

    return () => {
      window.removeEventListener("keydown", handlePopupKeyDown);
    };
  }, [deleteCompletedItems, deleteElement, deleteProfile, popup, setPopup]);

  return (
    <div className={s.root}>
      <AnimatePresence>
        {popup && (
          <PopupMenu>
            {popup.type === "delete" && (
              <>
                <h3 className={s.popupTitle}>
                  Вы точно хотите удалить этот элемент?
                </h3>
                <div className={s.popupDesc}>
                  Удалив элемент, вы больше не можете его восстановить.
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    variant="BGdanger"
                    ariaLabel="Подтвердить удаление"
                    onClick={() => deleteElement(popup.itemId)}
                  >
                    Удалить
                  </Btn>
                  <Btn
                    variant="BGprimary"
                    ariaLabel="Отменить удаление"
                    onClick={() => setPopup(null)}
                  >
                    Отмена
                  </Btn>
                </div>
              </>
            )}
            {popup.type === "addProfile" && (
              <AddProfilePopup
                initialName={popup.initialName}
                onAddProfile={addProfile}
                onClose={() => setPopup(null)}
                profileData={profileData}
              />
            )}
            {popup.type === "deleteProfile" && (
              <>
                <h3 className={s.popupTitle}>В категории есть заметки</h3>
                <div className={s.popupDesc}>
                  Категория «{popup.profileName}» содержит заметок:{" "}
                  {popup.notesCount}. Если удалить категорию, эти заметки тоже
                  будут удалены.
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    variant="BGdanger"
                    ariaLabel="Подтвердить удаление категории"
                    onClick={() => deleteProfile(popup.profileId, { force: true })}
                  >
                    Удалить
                  </Btn>
                  <Btn
                    variant="BGprimary"
                    ariaLabel="Отменить удаление категории"
                    onClick={() => setPopup(null)}
                  >
                    Отмена
                  </Btn>
                </div>
              </>
            )}
            {popup.type === "deleteCompleted" && (
              <>
                <h3 className={s.popupTitle}>Удалить выполненные задачи?</h3>
                <div className={s.popupDesc}>
                  Будет удалено: {popup.count}. Это действие нельзя отменить.
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    variant="BGdanger"
                    ariaLabel="Подтвердить удаление выполненных"
                    onClick={deleteCompletedItems}
                  >
                    Удалить
                  </Btn>
                  <Btn
                    variant="BGprimary"
                    ariaLabel="Отменить удаление выполненных"
                    onClick={() => setPopup(null)}
                  >
                    Отмена
                  </Btn>
                </div>
              </>
            )}
          </PopupMenu>
        )}
      </AnimatePresence>
      <ToDoContainer />
    </div>
  );
}

export default App;
