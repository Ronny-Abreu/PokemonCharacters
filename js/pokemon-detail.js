const $ = window.$
const i18next = window.i18next 

$(document).ready(() => {
  const waitForI18n = () => {
    if (typeof i18next !== "undefined" && i18next.isInitialized) {
      initializePokemonDetail()
    } else {
      setTimeout(waitForI18n, 100)
    }
  }

  waitForI18n()
})

const initializePokemonDetail = () => {
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function formatPokemonName(name) {
    return name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  function formatPokemonId(id) {
    return id.toString().padStart(3, "0")
  }

  function formatHeight(height) {
    return `${height / 10} m`
  }

  function formatWeight(weight) {
    return `${weight / 10} kg`
  }

  function getPokemonImageUrl(pokemonId, shiny = false) {
    const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
    return shiny ? `${baseUrl}/shiny/${pokemonId}.png` : `${baseUrl}/${pokemonId}.png`
  }

  function getPokemonArtworkUrl(pokemonId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
  }

  function getTypeColorClass(typeName) {
    return `type-${typeName.toLowerCase()}`
  }

  function showLoading(elementId) {
    $(`#${elementId}`).removeClass("hidden")
  }

  function hideLoading(elementId) {
    $(`#${elementId}`).addClass("hidden")
  }

  function showError(message, containerId = "pokemonDetail") {
    const container = $(`#${containerId}`)
    if (container.length) {
      container.html(`
        <div class="text-center py-12">
          <div class="text-red-500 text-6xl mb-4">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">${i18next.t("errors.somethingWrong")}</h3>
          <p class="text-white mb-4">${message}</p>
          <button onclick="location.reload()" class="bg-white/20 text-white px-6 py-3 rounded-full hover:bg-white/30 transition-colors border border-white/30">
            <i class="fas fa-refresh mr-2"></i>
            ${i18next.t("buttons.tryAgain")}
          </button>
        </div>
      `)
      container.removeClass("hidden")
    }
  }

  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
  }

  function formatStatName(statName) {
    return i18next.t(`stats.${statName}`, { defaultValue: capitalizeFirst(statName) })
  }

  function getStatColor(value) {
    if (value >= 100) return "#4ade80" // green
    if (value >= 80) return "#facc15" // yellow
    if (value >= 60) return "#fb923c" // orange
    return "#ef4444" // red
  }

  // Función para calcular el porcentaje de la estadística
  function getStatPercentage(value) {

    const maxStat = 255
    return Math.min((value / maxStat) * 100, 100)
  }

  // API functions
  const pokemonAPI = {
    cache: new Map(),

    async getPokemonDetails(pokemonId) {
      const cacheKey = `pokemon-${pokemonId}`

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.cache.set(cacheKey, data)
        return data
      } catch (error) {
        console.error(`Error fetching Pokemon ${pokemonId}:`, error)
        throw error
      }
    },

    async getPokemonSpecies(pokemonId) {
      const cacheKey = `species-${pokemonId}`

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.cache.set(cacheKey, data)
        return data
      } catch (error) {
        console.error(`Error fetching Pokemon species ${pokemonId}:`, error)
        throw error
      }
    },
  }

  const pokemonId = getUrlParameter("id")

  if (!pokemonId) {
    showError(i18next.t("errors.invalidId"))
    return
  }

  loadPokemonDetail(pokemonId)

  async function loadPokemonDetail(id) {
    try {
      showLoading("loadingSpinner")

      console.log(`Loading Pokemon detail for ID: ${id}`)

      const [pokemon, species] = await Promise.all([pokemonAPI.getPokemonDetails(id), pokemonAPI.getPokemonSpecies(id)])

      console.log("Pokemon data loaded:", pokemon)
      console.log("Species data loaded:", species)

      renderPokemonDetail(pokemon, species)
    } catch (error) {
      console.error("Error loading Pokemon detail:", error)
      showError(i18next.t("errors.detailsError"))
    } finally {
      hideLoading("loadingSpinner")
    }
  }

  function renderPokemonDetail(pokemon, species) {
    const container = $("#pokemonDetail")

    const flavorText = getFlavorText(species.flavor_text_entries)
    const genus = getGenus(species.genera)

    const stats = pokemon.stats.map((stat) => ({
      name: formatStatName(stat.stat.name),
      value: stat.base_stat,
      color: getStatColor(stat.base_stat),
      percentage: getStatPercentage(stat.base_stat),
    }))

    const types = pokemon.types
      .map((type) => {
        const translatedType = i18next.t(`pokemonTypes.${type.type.name}`, {
          defaultValue: capitalizeFirst(type.type.name),
        })
        return `<span class="type-badge ${getTypeColorClass(type.type.name)}">${translatedType}</span>`
      })
      .join("")

    const abilities = pokemon.abilities
      .map(
        (ability) =>
          `<span class="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">${formatPokemonName(ability.ability.name)}</span>`,
      )
      .join("")

    const moves = pokemon.moves
      .slice(0, 8)
      .map(
        (move) =>
          `<span class="bg-robin-egg-blue text-black-olive px-3 py-1 rounded-full text-sm">${formatPokemonName(move.move.name)}</span>`,
      )
      .join("")

    const imageUrl = getPokemonArtworkUrl(pokemon.id)
    const shinyImageUrl = getPokemonImageUrl(pokemon.id, true)

    container.html(`
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-white/20" data-aos="fade-up">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div class="text-center lg:text-left">
              <div class="flex items-center justify-center lg:justify-start mb-4">
                <span class="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-lg font-bold mr-4 border border-white/30">
                  #${formatPokemonId(pokemon.id)}
                </span>
                <div class="flex flex-wrap gap-2">
                  ${types}
                </div>
              </div>
              
              <h1 class="text-5xl font-bold text-white mb-2">
                ${formatPokemonName(pokemon.name)}
              </h1>
              
              <p class="text-xl text-white/80 mb-4">${genus}</p>
              
              <p class="text-white/70 leading-relaxed mb-6">
                ${flavorText}
              </p>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <div class="text-3xl font-bold text-white">${formatHeight(pokemon.height)}</div>
                  <div class="text-white/70">${i18next.t("pokemon.height")}</div>
                </div>
                <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <div class="text-3xl font-bold text-white">${formatWeight(pokemon.weight)}</div>
                  <div class="text-white/70">${i18next.t("pokemon.weight")}</div>
                </div>
              </div>
            </div>
            
            <div class="text-center">
              <div class="relative inline-block">
                <img id="pokemonImage" 
                     src="${imageUrl}" 
                     alt="${formatPokemonName(pokemon.name)}"
                     class="w-80 h-80 object-contain transition-all duration-300 hover:scale-110 filter drop-shadow-2xl">
                
                <button onclick="toggleShiny()" 
                        class="absolute bottom-4 right-4 bg-yellow-400 text-black p-3 rounded-full shadow-lg hover:bg-yellow-300 transition-colors"
                        title="Ver versión shiny">
                  <i class="fas fa-star"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-white/20" data-aos="fade-up" data-aos-delay="100">
          <h2 class="text-3xl font-bold text-white mb-6 text-center">${i18next.t("modal.baseStats")}</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${stats
              .map(
                (stat, index) => `
                <div class="text-center stat-container" data-stat-value="${stat.value}">
                  <div class="text-2xl font-bold text-white mb-2 stat-number" data-target="${stat.value}">0</div>
                  <div class="text-white/70 mb-3">${stat.name}</div>

<div class="stat-bar-container">
                    <div class="stat-bar-background">
                      <div class="stat-bar-fill" 
                           data-width="${(stat.value / 255) * 100}%" 
                           data-color="${stat.color}"
                           style="background-color: ${stat.color}; animation-delay: ${index * 0.2}s">
                        <div class="stat-bar-glow"></div>
                      </div>
                    </div>
                    <div class="stat-percentage" data-percentage="${Math.round((stat.value / 255) * 100)}">0%</div>
                  <div class="stat-bar">
                    <div class="stat-fill" 
                         data-percentage="${stat.percentage}" 
                         data-delay="${index * 200}"
                         style="background-color: ${stat.color}"></div>
                  </div>
                  <div class="text-xs text-white/50 mt-1">${Math.round(stat.percentage)}%</div>
                </div>
              `,
              )
              .join("")}
          </div>
          
          <div class="mt-8 text-center">
            <div class="text-lg text-white/70">
              ${i18next.t("stats.total")}: <span class="font-bold text-white total-stats" data-total="${stats.reduce((sum, stat) => sum + stat.value, 0)}">0</span>
            </div>
          </div>
        </div>

        <!-- Abilities and Moves -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Abilities -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20" data-aos="fade-up" data-aos-delay="200">
            <h3 class="text-2xl font-bold text-white mb-4">${i18next.t("modal.abilities")}</h3>
            <div class="flex flex-wrap gap-2">
              ${abilities}
            </div>
          </div>
          
          <!-- Moves -->
          <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20" data-aos="fade-up" data-aos-delay="300">
            <h3 class="text-2xl font-bold text-white mb-4">${i18next.t("pokemon.moves")}</h3>
            <div class="flex flex-wrap gap-2">
              ${moves}
            </div>
            <p class="text-sm text-white/50 mt-4">Mostrando los primeros 8 movimientos</p>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20" data-aos="fade-up" data-aos-delay="400">
          <h2 class="text-3xl font-bold text-white mb-6 text-center">${i18next.t("modal.additionalInfo")}</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <div class="text-2xl font-bold text-white">${pokemon.base_experience || "N/A"}</div>
              <div class="text-white/70">${i18next.t("pokemon.baseExp")}</div>
            </div>
            
            <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <div class="text-2xl font-bold text-white">${species.capture_rate}</div>
              <div class="text-white/70">${i18next.t("pokemon.captureRate")}</div>
            </div>
            
            <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <div class="text-2xl font-bold text-white">${species.base_happiness}</div>
              <div class="text-white/70">${i18next.t("pokemon.baseHappiness")}</div>
            </div>
            
            <div class="text-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <div class="text-2xl font-bold text-white">${species.hatch_counter}</div>
              <div class="text-white/70">${i18next.t("pokemon.hatchCounter")}</div>
            </div>
          </div>
        </div>
      </div>
    `)

    container.removeClass("hidden")

    window.normalImageUrl = imageUrl
    window.shinyImageUrl = shinyImageUrl
    window.isShiny = false

    animateStatBars()

    console.log("Pokemon detail rendered successfully")
  }

  // función para animar las barras de estadísticas
  function animateStatBars() {
    setTimeout(() => {
      animateStatsBars()
    }, 500)
      $(".stat-fill").each(function () {
        const $bar = $(this)
        const percentage = $bar.data("percentage")
        const delay = $bar.data("delay") || 0

        setTimeout(() => {
          $bar.css("width", percentage + "%")
        }, delay)
      })
    }, 500)
  }

  function getFlavorText(flavorTextEntries) {
    const currentLang = i18next.language
    let targetText = null

    if (currentLang === "es") {
      targetText = flavorTextEntries.find((entry) => entry.language.name === "es")
    } else if (currentLang === "en") {
      targetText = flavorTextEntries.find((entry) => entry.language.name === "en")
    } else if (currentLang === "fr") {
      targetText = flavorTextEntries.find((entry) => entry.language.name === "fr")
    }

    if (!targetText) {
      targetText = flavorTextEntries.find((entry) => entry.language.name === "en")
    }

    if (!targetText && flavorTextEntries.length > 0) {
      targetText = flavorTextEntries[0]
    }

    return targetText ? targetText.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ") : "Descripción no disponible"
  }

  function getGenus(genera) {
    const currentLang = i18next.language
    let targetGenus = null

    // Try to find genus in current language
    if (currentLang === "es") {
      targetGenus = genera.find((genus) => genus.language.name === "es")
    } else if (currentLang === "en") {
      targetGenus = genera.find((genus) => genus.language.name === "en")
    } else if (currentLang === "fr") {
      targetGenus = genera.find((genus) => genus.language.name === "fr")
    }

    // Fallback to English if current language not found
    if (!targetGenus) {
      targetGenus = genera.find((genus) => genus.language.name === "en")
    }
    const spanishGenus = genera.find((genus) => genus.language.name === "es")
    const englishGenus = genera.find((genus) => genus.language.name === "en")

    // Final fallback to first available
    if (!targetGenus && genera.length > 0) {
      targetGenus = genera[0]
    }

    return targetGenus ? targetGenus.genus : "Pokémon"
  }

  window.toggleShiny = () => {
    const image = document.getElementById("pokemonImage")
    if (!image) return

    window.isShiny = !window.isShiny

    image.src = window.isShiny ? window.shinyImageUrl : window.normalImageUrl

    image.style.filter = window.isShiny
      ? "drop-shadow(0 0 20px gold)"
      : "drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))"
  }

  function animateStatsBars() {
    const statContainers = document.querySelectorAll(".stat-container")
    let totalSum = 0

    statContainers.forEach((container, index) => {
      const statNumber = container.querySelector(".stat-number")
      const statBar = container.querySelector(".stat-bar-fill")
      const statPercentage = container.querySelector(".stat-percentage")
      const targetValue = Number.parseInt(statNumber.dataset.target)
      const targetWidth = Number.parseFloat(statBar.dataset.width)
      const targetPercentage = Number.parseInt(statPercentage.dataset.percentage)

      totalSum += targetValue

      // Animate with delay for each stat
      setTimeout(() => {
        animateNumber(statNumber, 0, targetValue, 1500)

        // Animate the percentage
        animateNumber(statPercentage, 0, targetPercentage, 1500, "%")

        statBar.style.transition = "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
        statBar.style.width = targetWidth + "%"

        setTimeout(() => {
          statBar.classList.add("stat-complete")
        }, 1500)
      }, index * 200)
    })

    // Animate total stats number
    setTimeout(
      () => {
        const totalElement = document.querySelector(".total-stats")
        const targetTotal = Number.parseInt(totalElement.dataset.total)
        animateNumber(totalElement, 0, targetTotal, 2000)
      },
      statContainers.length * 200 + 500,
    )
  }

  function animateNumber(element, start, end, duration, suffix = "") {
    const range = end - start
    const increment = range / (duration / 16)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        current = end
        clearInterval(timer)
      }
      element.textContent = Math.floor(current) + suffix
    }, 16)
  }
}
