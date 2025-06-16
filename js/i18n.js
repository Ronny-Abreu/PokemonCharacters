let initI18n = () => {
  // Obtener idioma guardado o predeterminado al español
  const savedLanguage = localStorage.getItem("pokemonAppLanguage") || "es"

  if (
    typeof window.i18next === "undefined" ||
    typeof window.jqueryI18next === "undefined" ||
    typeof window.i18nextHttpBackend === "undefined"
  ) {
    setTimeout(initI18n, 100)
    return
  }

  window.i18next
    .use(window.i18nextHttpBackend)
    .init({
      lng: savedLanguage,
      fallbackLng: "es",
      debug: false,

      backend: {
        loadPath: "./locales/{{lng}}/translation.json",
      },

      interpolation: {
        escapeValue: false,
      },
    })
    .then(() => {
      window.jqueryI18next.init(window.i18next, window.$)

      updateContent()

      setupLanguageSwitcher()

      window.$("html").attr("lang", window.i18next.language)

      console.log("Analizando mensaje:", window.i18next.language)
    })
    .catch((error) => {
      console.error("Error al inicializar i18next:", error)
    })
}

// Update page content with translations
const updateContent = () => {
  window.$("[data-i18n]").localize()

  // Update document title
  if (window.i18next.exists("page.title")) {
    document.title = window.i18next.t("page.title")
  }

  window.$('[data-i18n*="[placeholder]"]').each(function () {
    const key = window.$(this).attr("data-i18n").replace("[placeholder]", "")
    window.$(this).attr("placeholder", window.i18next.t(key))
  })

  window.$('[data-i18n*="[title]"]').each(function () {
    const key = window.$(this).attr("data-i18n").replace("[title]", "")
    window.$(this).attr("title", window.i18next.t(key))
  })
}

const setupLanguageSwitcher = () => {
  // Desktop language dropdown
  window
    .$("#languageBtn")
    .off("click")
    .on("click", (e) => {
      e.preventDefault()
      window.$("#languageDropdown").toggleClass("hidden")
    })

  window
    .$(document)
    .off("click.languageDropdown")
    .on("click.languageDropdown", (e) => {
      if (!window.$(e.target).closest("#languageBtn, #languageDropdown").length) {
        window.$("#languageDropdown").addClass("hidden")
      }
    })

  window
    .$(".language-option")
    .off("click")
    .on("click", function (e) {
      e.preventDefault()
      const lang = window.$(this).data("lang")
      changeLanguage(lang)
      window.$("#languageDropdown").addClass("hidden")
    })

  // Mobile language option click handlers
  window
    .$(".language-option-mobile")
    .off("click")
    .on("click", function (e) {
      e.preventDefault()
      const lang = window.$(this).data("lang")
      changeLanguage(lang)

      window.$("#mobileMenuContent").addClass("-translate-x-full")
      setTimeout(() => {
        window.$("#mobileMenu").addClass("hidden")
      }, 300)
    })

  updateActiveLanguage()
}

// Change language function
const changeLanguage = (lang) => {
  if (lang === window.i18next.language) return

  window.i18next
    .changeLanguage(lang)
    .then(() => {
      // Save language preference
      localStorage.setItem("pokemonAppLanguage", lang)

      window.$("html").attr("lang", lang)

      updateContent()

      updateActiveLanguage()

      // Reload Pokemon types if they exist
      if (typeof window.loadPokemonTypes === "function") {
        window.loadPokemonTypes()
      }

      console.log("Language changed to:", lang)
    })
    .catch((error) => {
      console.error("Error changing language:", error)
    })
}

const updateActiveLanguage = () => {
  const currentLang = window.i18next.language

  // Update desktop dropdown
  window.$(".language-option").removeClass("bg-white/30")
  window.$(`.language-option[data-lang="${currentLang}"]`).addClass("bg-white/30")

  // Update mobile buttons
  window.$(".language-option-mobile").removeClass("bg-white/40")
  window.$(`.language-option-mobile[data-lang="${currentLang}"]`).addClass("bg-white/40")
}

const t = (key, options = {}) => {
  return window.i18next.t(key, options)
}

const translatePokemonType = (type) => {
  return window.i18next.t(`pokemonTypes.${type}`, { defaultValue: type })
}

const translateStatName = (statName) => {
  return window.i18next.t(`stats.${statName}`, { defaultValue: statName })
}

window.$(document).ready(() => {
  initI18n()
})

window.i18nUtils = {
  t,
  translatePokemonType,
  translateStatName,
  changeLanguage,
  updateContent,
}

window.i18nextReady = false

const originalInit = initI18n
initI18n = () => {
  originalInit()
  if (typeof window.i18next !== "undefined") {
    const checkReady = () => {
      if (window.i18next.isInitialized) {
        window.i18nextReady = true
      } else {
        setTimeout(checkReady, 50)
      }
    }
    checkReady()
  }
}
