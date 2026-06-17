import React, { memo, useContext } from "react";
import {
  SettingsToDoContext,
  ThemesToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import { SegmentedControl } from "../UIkit/SegmentedControl/SegmentedControl";
import { useI18n } from "../../i18n/i18n";
import s from "./SettingsView.module.scss";

const SettingsView = memo(() => {
  const { themesData, theme, setTheme } = useContext(ThemesToDoContext);
  const {
    deleteAfterDeadline,
    language,
    setDeleteAfterDeadline,
    setLanguage,
    weekStart,
    setWeekStart,
  } = useContext(SettingsToDoContext);
  const { t } = useI18n();
  const weekStartOptions = [
    {
      value: "monday",
      label: t("settings.weekStartMonday"),
      ariaLabel: t("settings.startMonday"),
    },
    {
      value: "sunday",
      label: t("settings.weekStartSunday"),
      ariaLabel: t("settings.startSunday"),
    },
  ];
  const languageOptions = [
    {
      value: "ru",
      label: t("settings.languageRu"),
      ariaLabel: t("settings.selectRussian"),
    },
    {
      value: "en",
      label: t("settings.languageEn"),
      ariaLabel: t("settings.selectEnglish"),
    },
  ];
  const deleteAfterDeadlineOptions = [
    {
      value: "off",
      label: t("settings.deleteAfterDeadlineOff"),
      ariaLabel: t("settings.disableDeleteAfterDeadline"),
    },
    {
      value: "on",
      label: t("settings.deleteAfterDeadlineOn"),
      ariaLabel: t("settings.enableDeleteAfterDeadline"),
    },
  ];

  return (
    <section className={s.root} aria-label={t("settings.aria")}>
      <div className={s.header}>
        <h1>{t("settings.title")}</h1>
      </div>

      <div className={s.settingGroup}>
        <div className={s.settingText}>
          <h2>{t("settings.theme")}</h2>
        </div>
        <div className={s.optionGrid} aria-label={t("settings.theme")}>
          {themesData.map((themeItem) => (
            <button
              aria-label={t("settings.themeSelect", { name: themeItem.name })}
              className={theme === themeItem.id ? s.activeOption : ""}
              key={themeItem.id}
              type="button"
              onClick={() => setTheme(themeItem.id)}
            >
              <span
                className={`${s.themeSwatch} ${s[themeItem.class]}`}
                aria-hidden="true"
              />
              {themeItem.name}
            </button>
          ))}
        </div>
      </div>

      <div className={s.settingGroup}>
        <div className={s.settingText}>
          <h2>{t("settings.weekStart")}</h2>
        </div>
        <SegmentedControl
          ariaLabel={t("settings.weekStart")}
          className={s.segmented}
          options={weekStartOptions}
          value={weekStart}
          onChange={setWeekStart}
        />
      </div>

      <div className={s.settingGroup}>
        <div className={s.settingText}>
          <h2>{t("settings.language")}</h2>
        </div>
        <SegmentedControl
          ariaLabel={t("settings.language")}
          className={s.segmented}
          options={languageOptions}
          value={language}
          onChange={setLanguage}
        />
      </div>

      <div className={s.settingGroup}>
        <div className={s.settingText}>
          <h2>{t("settings.deleteAfterDeadline")}</h2>
        </div>
        <SegmentedControl
          ariaLabel={t("settings.deleteAfterDeadline")}
          className={s.segmented}
          options={deleteAfterDeadlineOptions}
          value={deleteAfterDeadline ? "on" : "off"}
          onChange={(value) => setDeleteAfterDeadline(value === "on")}
        />
      </div>
    </section>
  );
});

export { SettingsView };
