import { useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AuthToDoContext,
  FunctionToDoContext,
  CategoryToDoContext,
  ThemesToDoContext,
  ToDoContext,
} from "./context/ToDoProvider/ToDoProvider";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";
import PopupMenu from "./components/PopupMenu/PopupMenu";
import Btn from "./components/UIkit/Btn/Btn";
import { useI18n } from "./i18n/i18n";
import s from "./App.module.scss";

const CATEGORY_NAME_LIMIT = 32;

function AuthScreen() {
  const { register, signIn } = useContext(AuthToDoContext);
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const canSubmit = username.trim().length > 0 && password.length > 0;

  function handleSignIn(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (!signIn({ username, password })) {
      setError(t("auth.signInError"));
    }
  }

  function handleRegister() {
    if (!canSubmit) {
      return;
    }

    if (!register({ username, password })) {
      setError(t("auth.duplicateAccount"));
      return;
    }

    setError("");
  }

  return (
    <div className={s.authShell}>
      <form className={s.authCard} onSubmit={handleSignIn}>
        <div className={s.authHeader}>
          <h1 className={s.authTitle}>{t("auth.title")}</h1>
          <p className={s.authText}>{t("auth.intro")}</p>
        </div>
        <label className={s.authLabel}>
          {t("auth.username")}
          <input
            aria-label={t("auth.username")}
            className={s.authInput}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setError("");
            }}
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className={s.authLabel}>
          {t("auth.password")}
          <input
            aria-label={t("auth.password")}
            className={s.authInput}
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            autoComplete="current-password"
          />
        </label>
        {error && <div className={s.authError}>{error}</div>}
        <div className={s.authActions}>
          <Btn
            className={s.popupPrimaryAction}
            type="submit"
            variant="ghost"
            ariaLabel={t("auth.signIn")}
            disabled={!canSubmit}
          >
            {t("auth.signIn")}
          </Btn>
          <Btn
            className={s.popupSecondaryAction}
            variant="ghost"
            ariaLabel={t("auth.createAccount")}
            disabled={!canSubmit}
            onClick={handleRegister}
          >
            {t("auth.createAccount")}
          </Btn>
        </div>
      </form>
    </div>
  );
}

function AddCategoryPopup({ initialName = "", onAddCategory, onClose, categoryData }) {
  const { t } = useI18n();
  const [categoryName, setCategoryName] = useState(
    initialName.slice(0, CATEGORY_NAME_LIMIT)
  );
  const normalizedName = categoryName.trim().toLowerCase();
  const isDuplicate = categoryData.some(
    (categoryItem) => categoryItem.name.toLowerCase() === normalizedName
  );
  const canSubmit = normalizedName.length > 0 && !isDuplicate;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (onAddCategory(categoryName)) {
      onClose();
    }
  }

  return (
    <form className={s.popupForm} onSubmit={handleSubmit}>
      <h3 className={s.popupTitle}>{t("category.add")}</h3>
      <label className={s.popupLabel}>
        {t("category.name")}
        <input
          aria-label={t("category.name")}
          className={s.popupInput}
          value={categoryName}
          onChange={(event) =>
            setCategoryName(event.target.value.slice(0, CATEGORY_NAME_LIMIT))
          }
          maxLength={CATEGORY_NAME_LIMIT}
          placeholder={t("category.placeholder")}
          autoFocus
        />
        <span className={s.popupCounter}>
          {categoryName.length}/{CATEGORY_NAME_LIMIT}
        </span>
        {isDuplicate && (
          <span className={s.popupError}>{t("category.duplicate")}</span>
        )}
      </label>
      <div className={s.popupBtns}>
        <Btn
          className={s.popupPrimaryAction}
          type="submit"
          variant="ghost"
          ariaLabel={t("category.add")}
          disabled={!canSubmit}
        >
          {t("actions.add")}
        </Btn>
        <Btn
          className={s.popupSecondaryAction}
          variant="ghost"
          ariaLabel={t("actions.cancel")}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Btn>
      </div>
    </form>
  );
}

function App() {
  const { currentAccount } = useContext(AuthToDoContext);
  const { popup } = useContext(ToDoContext);
  const { addCategory, deleteCompletedItems, deleteElement, setPopup } =
    useContext(FunctionToDoContext);
  const { deleteCategory, categoryData } = useContext(CategoryToDoContext);
  const { theme, themesData } = useContext(ThemesToDoContext);
  const { t } = useI18n();

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.toggle(s[themesData[theme].class]);
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

      if (event.key === "Enter" && popup.type === "deleteCategory") {
        event.preventDefault();
        deleteCategory(popup.categoryId, { force: true });
      }

      if (event.key === "Enter" && popup.type === "deleteCompleted") {
        event.preventDefault();
        deleteCompletedItems({ itemIds: popup.itemIds });
      }

      if (event.key === "Enter" && popup.type === "deadlineWarning") {
        event.preventDefault();
        setPopup(null);
      }
    }

    window.addEventListener("keydown", handlePopupKeyDown);

    return () => {
      window.removeEventListener("keydown", handlePopupKeyDown);
    };
  }, [deleteCompletedItems, deleteElement, deleteCategory, popup, setPopup]);

  return (
    <div className={s.root}>
      {!currentAccount ? (
        <AuthScreen />
      ) : (
        <>
      <AnimatePresence>
        {popup && (
          <PopupMenu>
            {popup.type === "delete" && (
              <>
                <h3 className={s.popupTitle}>
                  {t("popup.deleteTitle")}
                </h3>
                <div className={s.popupDesc}>
                  {t("popup.deleteDescription")}
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    className={s.popupDangerAction}
                    variant="ghost"
                    ariaLabel={t("popup.deleteConfirm")}
                    onClick={() => deleteElement(popup.itemId)}
                  >
                    {t("actions.delete")}
                  </Btn>
                  <Btn
                    className={s.popupSecondaryAction}
                    variant="ghost"
                    ariaLabel={t("popup.cancelDelete")}
                    onClick={() => setPopup(null)}
                  >
                    {t("actions.cancel")}
                  </Btn>
                </div>
              </>
            )}
            {popup.type === "addCategory" && (
              <AddCategoryPopup
                initialName={popup.initialName}
                onAddCategory={(categoryName) =>
                  addCategory(categoryName, {
                    select:
                      popup.categoryTarget === "draft" ? "draft" : "current",
                  })
                }
                onClose={() => setPopup(null)}
                categoryData={categoryData}
              />
            )}
            {popup.type === "deleteCategory" && (
              <>
                <h3 className={s.popupTitle}>{t("category.withNotes")}</h3>
                <div className={s.popupDesc}>
                  {t("category.withNotesDescription", {
                    count: popup.notesCount,
                    name: popup.categoryName,
                  })}
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    className={s.popupDangerAction}
                    variant="ghost"
                    ariaLabel={t("popup.deleteCategoryConfirm")}
                    onClick={() => deleteCategory(popup.categoryId, { force: true })}
                  >
                    {t("actions.delete")}
                  </Btn>
                  <Btn
                    className={s.popupSecondaryAction}
                    variant="ghost"
                    ariaLabel={t("popup.cancelDelete")}
                    onClick={() => setPopup(null)}
                  >
                    {t("actions.cancel")}
                  </Btn>
                </div>
              </>
            )}
            {popup.type === "deleteCompleted" && (
              <>
                <h3 className={s.popupTitle}>
                  {popup.dateTitle
                    ? t("popup.deleteCompletedForDate", { date: popup.dateTitle })
                    : t("popup.deleteCompletedTitle")}
                </h3>
                <div className={s.popupDesc}>
                  {t("popup.deleteCompletedDescription", { count: popup.count })}
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    className={s.popupDangerAction}
                    variant="ghost"
                    ariaLabel={t("popup.deleteCompletedConfirm")}
                    onClick={() => deleteCompletedItems({ itemIds: popup.itemIds })}
                  >
                    {t("actions.delete")}
                  </Btn>
                  <Btn
                    className={s.popupSecondaryAction}
                    variant="ghost"
                    ariaLabel={t("popup.cancelDelete")}
                    onClick={() => setPopup(null)}
                  >
                    {t("actions.cancel")}
                  </Btn>
                </div>
              </>
            )}
            {popup.type === "deadlineWarning" && (
              <>
                <h3 className={s.popupTitle}>
                  {t("popup.deadlineBeforeScheduledTitle")}
                </h3>
                <div className={s.popupDesc}>
                  {t("popup.deadlineBeforeScheduledDescription")}
                </div>
                <div className={s.popupBtns}>
                  <Btn
                    className={s.popupSecondaryAction}
                    variant="ghost"
                    ariaLabel={t("popup.closeNotification")}
                    onClick={() => setPopup(null)}
                  >
                    {t("popup.closeNotification")}
                  </Btn>
                </div>
              </>
            )}
          </PopupMenu>
        )}
      </AnimatePresence>
      <ToDoContainer />
        </>
      )}
    </div>
  );
}

export default App;
