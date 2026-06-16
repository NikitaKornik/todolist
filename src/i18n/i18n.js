import { useContext, useMemo } from "react";
import { SettingsToDoContext } from "../context/ToDoProvider/ToDoProvider";

export const LANGUAGE_LOCALES = {
  en: "en-US",
  ru: "ru-RU",
};

const translations = {
  ru: {
    actions: {
      add: "Добавить",
      back: "Вернуться назад",
      cancel: "Отмена",
      clear: "Очистить",
      delete: "Удалить",
      save: "Сохранить",
    },
    auth: {
      accountLabel: "Аккаунт: {username}",
      createAccount: "Создать аккаунт",
      duplicateAccount: "Такой аккаунт уже существует",
      intro: "Локальный аккаунт хранит заметки отдельно в этом браузере.",
      password: "Пароль",
      signIn: "Войти",
      signInError: "Аккаунт не найден или пароль неверный",
      signOut: "Выйти из аккаунта",
      title: "Вход в аккаунт",
      username: "Имя пользователя",
    },
    calendar: {
      addedFull: "{count} добавлено",
      addedShort: "{count} доб.",
      addedSectionAria: "Заметки, добавленные в выбранный день",
      addedTitle: "Добавлены в этот день",
      aria: "Календарь заметок",
      dayManagement: "Управление выбранным днем",
      dayStats: "Статистика выбранного дня",
      deadlineFull: "{count} дедлайн",
      deadlineShort: "{count} дед.",
      deadlinesSectionAria: "Дедлайны выбранного дня",
      deadlinesTitle: "Дедлайны на этот день",
      deleteCompletedForDate: "Удалить выполненные за {date}",
      emptyAdded: "Нет добавленных заметок",
      emptyDeadlines: "Нет дедлайнов",
      nextMonth: "Следующий месяц",
      nextYear: "Следующий год",
      nextYears: "Следующие годы",
      openDay: "Открыть день {date}",
      pickDeadline: "Выбрать дедлайн: {date}",
      previousMonth: "Предыдущий месяц",
      previousYear: "Предыдущий год",
      previousYears: "Предыдущие годы",
      selectedDayNotes: "Заметки выбранного дня",
      selectedDayStats: "{created} добавлено / {deadlines} дедлайнов",
      setMonth: "Установить месяц {month}",
      setYear: "Установить год {year}",
      weekdays: "Дни недели",
      weekDays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      weekDaysFromSunday: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      selectMonth: "Выбрать месяц {month}",
      selectYear: "Выбрать год {year}",
    },
    category: {
      add: "Добавить категорию",
      addItem: "Добавить +",
      duplicate: "Такая категория уже существует",
      label: "Категория",
      name: "Название категории",
      placeholder: "Например: errands",
      selectNote: "Выбрать категорию заметки",
      withNotes: "В категории есть заметки",
      withNotesDescription:
        "Категория «{name}» содержит заметок: {count}. Если удалить категорию, эти заметки тоже будут удалены.",
    },
    categoryNames: {
      all: "all",
    },
    deadline: {
      clear: "Очистить дедлайн {deadline}",
      date: "Дата",
      label: "Дедлайн",
      overdue: "Просрочено",
      pick: "Выбрать дедлайн",
      pickDate: "Выберите дату",
      time: "Время",
      timeLabel: "Время дедлайна",
      today: "Сегодня",
      tomorrow: "Завтра",
    },
    dropdown: {
      deleteFilter: "Удалить фильтр {name}",
      openList: "Открыть список: {name}",
      search: "Поиск",
      searchFilters: "Поиск фильтров",
      sortByCreatedAt: "по дате",
      sortByName: "по имени",
      sortFiltersByCreatedAt: "Сортировать фильтры по времени создания",
      sortFiltersByName: "Сортировать фильтры по имени",
    },
    header: {
      calendar: "Календарь",
      completed: "Выполненные",
      count: "Заметок: {count}",
      list: "Список",
      openAccountMenu: "Открыть меню аккаунта {username}",
      openCalendar: "Открыть календарь",
      openList: "Открыть список заметок",
      openSettings: "Открыть настройки",
      search: "Поиск заметок",
      deleteCompleted: "Удалить выполненные",
      showColumns: "Показать двумя колонками",
      showRows: "Показать одной колонкой",
      viewMode: "Режим отображения",
    },
    popup: {
      deleteCategoryConfirm: "Подтвердить удаление категории",
      deleteCompletedConfirm: "Подтвердить удаление выполненных",
      deleteCompletedDescription:
        "Будет удалено: {count}. Это действие нельзя отменить.",
      deleteCompletedForDate: "Удалить выполненные за {date}?",
      deleteCompletedTitle: "Удалить выполненные задачи?",
      deleteConfirm: "Подтвердить удаление",
      deleteDescription:
        "Удалив элемент, вы больше не можете его восстановить.",
      deleteTitle: "Вы точно хотите удалить этот элемент?",
      cancelDelete: "Отменить удаление",
    },
    settings: {
      aria: "Страница настроек",
      language: "Язык",
      languageEn: "English",
      languageRu: "Русский",
      selectEnglish: "Выбрать английский язык",
      selectRussian: "Выбрать русский язык",
      startMonday: "Начинать неделю с понедельника",
      startSunday: "Начинать неделю с воскресенья",
      theme: "Тема",
      themeSelect: "Выбрать тему {name}",
      title: "Настройки",
      weekStart: "Начало недели",
      weekStartMonday: "Понедельник",
      weekStartSunday: "Воскресенье",
    },
    todo: {
      add: "Добавить заметку",
      addEmpty: "Ваш список пуст, пора что-то добавить!",
      addToFavorite: "Добавить в избранное",
      cancelEdit: "Отменить редактирование",
      closeEdit: "Закрыть редактирование элемента",
      date: "Дата",
      delete: "Удалить",
      edit: "Редактировать",
      markDone: "Отметить выполненным",
      noSearchResults: "Ничего не найдено",
      removeFromFavorite: "Убрать из избранного",
      save: "Сохранить заметку",
      text: "Текст заметки",
      textPlaceholder: "Введите текст...",
      unmarkDone: "Снять отметку",
    },
  },
  en: {
    actions: {
      add: "Add",
      back: "Go back",
      cancel: "Cancel",
      clear: "Clear",
      delete: "Delete",
      save: "Save",
    },
    auth: {
      accountLabel: "Account: {username}",
      createAccount: "Create account",
      duplicateAccount: "This account already exists",
      intro: "A local account keeps notes separate in this browser.",
      password: "Password",
      signIn: "Sign in",
      signInError: "Account not found or password is incorrect",
      signOut: "Sign out of account",
      title: "Sign in",
      username: "Username",
    },
    calendar: {
      addedFull: "{count} added",
      addedShort: "{count} add.",
      addedSectionAria: "Notes added on the selected day",
      addedTitle: "Added on this day",
      aria: "Notes calendar",
      dayManagement: "Selected day controls",
      dayStats: "Selected day stats",
      deadlineFull: "{count} deadline",
      deadlineShort: "{count} due",
      deadlinesSectionAria: "Selected day deadlines",
      deadlinesTitle: "Deadlines on this day",
      deleteCompletedForDate: "Delete completed for {date}",
      emptyAdded: "No added notes",
      emptyDeadlines: "No deadlines",
      nextMonth: "Next month",
      nextYear: "Next year",
      nextYears: "Next years",
      openDay: "Open {date}",
      pickDeadline: "Pick deadline: {date}",
      previousMonth: "Previous month",
      previousYear: "Previous year",
      previousYears: "Previous years",
      selectedDayNotes: "Selected day notes",
      selectedDayStats: "{created} added / {deadlines} deadlines",
      setMonth: "Set month {month}",
      setYear: "Set year {year}",
      weekdays: "Weekdays",
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      weekDaysFromSunday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      selectMonth: "Select month {month}",
      selectYear: "Select year {year}",
    },
    category: {
      add: "Add category",
      addItem: "Add +",
      duplicate: "This category already exists",
      label: "Category",
      name: "Category name",
      placeholder: "For example: errands",
      selectNote: "Select note category",
      withNotes: "Category has notes",
      withNotesDescription:
        "Category “{name}” contains notes: {count}. If you delete the category, those notes will also be deleted.",
    },
    categoryNames: {
      all: "all",
    },
    deadline: {
      clear: "Clear deadline {deadline}",
      date: "Date",
      label: "Deadline",
      overdue: "Overdue",
      pick: "Pick deadline",
      pickDate: "Pick a date",
      time: "Time",
      timeLabel: "Deadline time",
      today: "Today",
      tomorrow: "Tomorrow",
    },
    dropdown: {
      deleteFilter: "Delete filter {name}",
      openList: "Open list: {name}",
      search: "Search",
      searchFilters: "Search filters",
      sortByCreatedAt: "by date",
      sortByName: "by name",
      sortFiltersByCreatedAt: "Sort filters by creation time",
      sortFiltersByName: "Sort filters by name",
    },
    header: {
      calendar: "Calendar",
      completed: "Completed",
      count: "Notes: {count}",
      list: "List",
      openAccountMenu: "Open account menu for {username}",
      openCalendar: "Open calendar",
      openList: "Open notes list",
      openSettings: "Open settings",
      search: "Search notes",
      deleteCompleted: "Delete completed",
      showColumns: "Show two columns",
      showRows: "Show one column",
      viewMode: "View mode",
    },
    popup: {
      deleteCategoryConfirm: "Confirm category deletion",
      deleteCompletedConfirm: "Confirm completed deletion",
      deleteCompletedDescription:
        "Will be deleted: {count}. This action cannot be undone.",
      deleteCompletedForDate: "Delete completed for {date}?",
      deleteCompletedTitle: "Delete completed tasks?",
      deleteConfirm: "Confirm deletion",
      deleteDescription: "After deleting this item, you cannot restore it.",
      deleteTitle: "Are you sure you want to delete this item?",
      cancelDelete: "Cancel deletion",
    },
    settings: {
      aria: "Settings page",
      language: "Language",
      languageEn: "English",
      languageRu: "Russian",
      selectEnglish: "Select English language",
      selectRussian: "Select Russian language",
      startMonday: "Start week on Monday",
      startSunday: "Start week on Sunday",
      theme: "Theme",
      themeSelect: "Select {name} theme",
      title: "Settings",
      weekStart: "Week start",
      weekStartMonday: "Monday",
      weekStartSunday: "Sunday",
    },
    todo: {
      add: "Add note",
      addEmpty: "Your list is empty. Time to add something!",
      addToFavorite: "Add to favorites",
      cancelEdit: "Cancel editing",
      closeEdit: "Close item editing",
      date: "Date",
      delete: "Delete",
      edit: "Edit",
      markDone: "Mark completed",
      noSearchResults: "Nothing found",
      removeFromFavorite: "Remove from favorites",
      save: "Save note",
      text: "Note text",
      textPlaceholder: "Enter text...",
      unmarkDone: "Unmark completed",
    },
  },
};

function getNestedValue(source, key) {
  return key.split(".").reduce((value, part) => value?.[part], source);
}

export function getLocale(language = "ru") {
  return LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES.ru;
}

export function translate(language, key, params = {}) {
  const dictionary = translations[language] || translations.ru;
  const fallbackDictionary = translations.ru;
  const template = getNestedValue(dictionary, key) ?? getNestedValue(fallbackDictionary, key);

  if (typeof template !== "string") {
    return template ?? key;
  }

  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) =>
      result.replaceAll(`{${paramKey}}`, String(paramValue)),
    template
  );
}

export function getCategoryLabel(categoryName, language = "ru") {
  const dictionary = translations[language] || translations.ru;
  const fallbackDictionary = translations.ru;
  return (
    getNestedValue(dictionary, `categoryNames.${categoryName}`) ??
    getNestedValue(fallbackDictionary, `categoryNames.${categoryName}`) ??
    categoryName
  );
}

export function useI18n() {
  const settings = useContext(SettingsToDoContext);
  const language = settings?.language || "ru";

  return useMemo(
    () => ({
      language,
      locale: getLocale(language),
      t: (key, params) => translate(language, key, params),
      categoryLabel: (categoryName) => getCategoryLabel(categoryName, language),
    }),
    [language]
  );
}
