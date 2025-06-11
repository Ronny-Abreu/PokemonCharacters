// Main Application Logic
const $ = window.$
const AOS = window.AOS
const gsap = window.gsap

$(document).ready(() => {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
    })
  }

  let currentOffset = 0
  const pokemonPerPage = 20
  let allLoadedPokemon = []
  let filteredPokemon = []
  let isLoading = false
  let selectedPokemon = null
  let lastScrollTop = 0

  const legendaryPokemonIds = [150, 144, 145, 146, 249, 250, 151, 384, 483, 484]

  $(window).scroll(function () {
    const scrollTop = $(this).scrollTop()
    const navbar = $("#navbar")

    if (scrollTop > lastScrollTop && scrollTop > 100) {
      navbar.addClass("hidden")
    } else {
      navbar.removeClass("hidden")
    }

    lastScrollTop = scrollTop
  })

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

  function showError(message, containerId = "pokemonGrid") {
    const container = $(`#${containerId}`)
    if (container.length) {
      container.html(`
        <div class="col-span-full text-center py-12">
          <div class="text-red-500 text-6xl mb-4">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">¡Oops! Algo salió mal</h3>
          <p class="text-white mb-4">${message}</p>
          <button onclick="location.reload()" class="bg-white/20 text-white px-6 py-3 rounded-full hover:bg-white/30 transition-colors border border-white/30">
            <i class="fas fa-refresh mr-2"></i>
            Intentar de nuevo
          </button>
        </div>
      `)
    }
  }

  function debounce(func, wait) {
    let timeout
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  // API functions
  const pokemonAPI = {
    cache: new Map(),

    async getPokemonList(limit = 20, offset = 0) {
      const cacheKey = `pokemon-list-${limit}-${offset}`

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.cache.set(cacheKey, data)
        return data
      } catch (error) {
        console.error("Error fetching Pokemon list:", error)
        throw error
      }
    },

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

    async getPokemonTypes() {
      const cacheKey = "pokemon-types"

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      try {
        const response = await fetch(`https://pokeapi.co/api/v2/type`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        this.cache.set(cacheKey, data.results)
        return data.results
      } catch (error) {
        console.error("Error fetching Pokemon types:", error)
        throw error
      }
    },

    async searchPokemon(query) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`)
        if (!response.ok) {
          return null
        }

        return await response.json()
      } catch (error) {
        console.error(`Error searching Pokemon ${query}:`, error)
        return null
      }
    },

    extractIdFromUrl(url) {
      const matches = url.match(/\/(\d+)\//)
      return matches ? Number.parseInt(matches[1]) : null
    },

    async loadPokemonBatch(pokemonList) {
      const promises = pokemonList.map(async (pokemon) => {
        try {
          const id = this.extractIdFromUrl(pokemon.url)
          return await this.getPokemonDetails(id)
        } catch (error) {
          console.error(`Error loading Pokemon ${pokemon.name}:`, error)
          return null
        }
      })

      const results = await Promise.all(promises)
      return results.filter((result) => result !== null)
    },
  }

  init()

  async function init() {
    try {
      console.log("Initializing app...")

      await loadLegendaryPokemon()

      await loadPokemonTypes()

      await loadInitialPokemon()

      setupEventListeners()

      console.log("App initialized successfully")
    } catch (error) {
      console.error("Error initializing app:", error)
      showError("Error al cargar la aplicación. Por favor, recarga la página.")
    }
  }

  function setupMobileMenu() {
    const mobileMenuBtn = $("#mobileMenuBtn")
    const mobileMenu = $("#mobileMenu")
    const mobileMenuContent = $("#mobileMenuContent")
    const mobileMenuOverlay = $("#mobileMenuOverlay")
    const closeMobileMenu = $("#closeMobileMenu")

    mobileMenuBtn.on("click", () => {
      mobileMenu.removeClass("hidden")
      setTimeout(() => {
        mobileMenuContent.removeClass("-translate-x-full")
      }, 10)
    })

    function closeMenu() {
      mobileMenuContent.addClass("-translate-x-full")
      setTimeout(() => {
        mobileMenu.addClass("hidden")
      }, 300)
    }

    closeMobileMenu.on("click", closeMenu)
    mobileMenuOverlay.on("click", closeMenu)

    $("#mobileMenu a").on("click", closeMenu)
  }

  // Mobile navbar switching
  function setupMobileNavbarSwitching() {
    const mobileNavHome = $("#mobileNavHome")
    const mobileNavOther = $("#mobileNavOther")

    $(window).scroll(function () {
      const scrollTop = $(this).scrollTop()
      const homeSection = $("#home")
      const homeSectionBottom = homeSection.offset().top + homeSection.outerHeight()

      if (window.innerWidth <= 768) {
        if (scrollTop >= homeSectionBottom - 100) {
          mobileNavHome.addClass("hidden")
          mobileNavOther.removeClass("hidden")
        } else {
          mobileNavHome.removeClass("hidden")
          mobileNavOther.addClass("hidden")
        }
      }
    })
  }

  function setupMobileLegendaryPokemonEvents() {
    $(".legendary-pokemon-card-mobile").on("click", async function () {
      const pokemonId = $(this).data("pokemon-id")
      await selectLegendaryPokemonMobile(pokemonId)
    })
  }

  async function selectLegendaryPokemonMobile(pokemonId) {
    try {
      const pokemon = await pokemonAPI.getPokemonDetails(pokemonId)

      $(".legendary-pokemon-card-mobile").addClass("dimmed")
      $(`.legendary-pokemon-card-mobile[data-pokemon-id="${pokemonId}"]`).removeClass("dimmed")

      const pokeball = $("#pokeball-mobile")
      const selectedDisplay = $("#selected-pokemon-mobile")

      pokeball.addClass("pokeball-opening")

      setTimeout(() => {
        pokeball.hide()

        $("#selected-pokemon-img-mobile").attr("src", getPokemonArtworkUrl(pokemon.id))
        $("#selected-pokemon-img-mobile").attr("alt", formatPokemonName(pokemon.name))
        $("#selected-pokemon-name-mobile").text(formatPokemonName(pokemon.name))

        const types = pokemon.types.map((type) => capitalizeFirst(type.type.name)).join(" / ")
        $("#selected-pokemon-type-mobile").text(types)

        selectedDisplay.removeClass("hidden").addClass("show")

        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            "#selected-pokemon-img-mobile",
            { scale: 0, rotation: 180 },
            { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)" },
          )

          gsap.fromTo(
            "#selected-pokemon-name-mobile",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, delay: 0.5 },
          )

          gsap.fromTo(
            "#selected-pokemon-type-mobile",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, delay: 0.7 },
          )
        }
      }, 1500)
    } catch (error) {
      console.error("Error selecting legendary Pokemon mobile:", error)
    }
  }

  // Reset pokeball display for mobile
  function resetPokeballMobile() {
    const pokeball = $("#pokeball-mobile")
    const selectedDisplay = $("#selected-pokemon-mobile")

    selectedDisplay.removeClass("show").addClass("hidden")

    pokeball.removeClass("pokeball-opening").show()

    $(".legendary-pokemon-card-mobile").removeClass("dimmed")
  }

  // Load legendary Pokemon for hero section
  async function loadLegendaryPokemon() {
    try {
      console.log("Loading legendary Pokemon...")

      for (const pokemonId of legendaryPokemonIds) {
        const pokemon = await pokemonAPI.getPokemonDetails(pokemonId)
        const card = $(`.legendary-pokemon-card[data-pokemon-id="${pokemonId}"]`)
        const img = card.find(".legendary-pokemon-img")

        if (img.length) {
          img.attr("src", getPokemonArtworkUrl(pokemon.id))
          img.attr("alt", formatPokemonName(pokemon.name))
        }

        const mobileCard = $(`.legendary-pokemon-card-mobile[data-pokemon-id="${pokemonId}"]`)
        const mobileImg = mobileCard.find(".legendary-pokemon-img-mobile")

        if (mobileImg.length) {
          mobileImg.attr("src", getPokemonArtworkUrl(pokemon.id))
          mobileImg.attr("alt", formatPokemonName(pokemon.name))
        }
      }

      console.log("Legendary Pokemon loaded successfully")
    } catch (error) {
      console.error("Error loading legendary Pokemon:", error)
    }
  }

  function setupLegendaryPokemonEvents() {
    $(".legendary-pokemon-card").on("click", async function () {
      const pokemonId = $(this).data("pokemon-id")
      await selectLegendaryPokemon(pokemonId)
    })
  }

  async function selectLegendaryPokemon(pokemonId) {
    try {
      const pokemon = await pokemonAPI.getPokemonDetails(pokemonId)
      selectedPokemon = pokemon

      $(".legendary-pokemon-card").addClass("dimmed")
      $(`.legendary-pokemon-card[data-pokemon-id="${pokemonId}"]`).removeClass("dimmed")

      const pokeball = $("#pokeball")
      const selectedDisplay = $("#selected-pokemon")

      pokeball.addClass("pokeball-opening")

      setTimeout(() => {
        pokeball.hide()

        $("#selected-pokemon-img").attr("src", getPokemonArtworkUrl(pokemon.id))
        $("#selected-pokemon-img").attr("alt", formatPokemonName(pokemon.name))
        $("#selected-pokemon-name").text(formatPokemonName(pokemon.name))

        const types = pokemon.types.map((type) => capitalizeFirst(type.type.name)).join(" / ")
        $("#selected-pokemon-type").text(types)

        // Show selected Pokemon with animation
        selectedDisplay.removeClass("hidden").addClass("show")

        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            "#selected-pokemon-img",
            { scale: 0, rotation: 180 },
            { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)" },
          )

          gsap.fromTo("#selected-pokemon-name", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.5 })

          gsap.fromTo("#selected-pokemon-type", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.7 })
        }
      }, 1500)
    } catch (error) {
      console.error("Error selecting legendary Pokemon:", error)
    }
  }

  function resetPokeball() {
    const pokeball = $("#pokeball")
    const selectedDisplay = $("#selected-pokemon")

    selectedDisplay.removeClass("show").addClass("hidden")

    pokeball.removeClass("pokeball-opening").show()

    $(".legendary-pokemon-card").removeClass("dimmed")

    selectedPokemon = null
  }

  async function loadPokemonTypes() {
    try {
      const types = await pokemonAPI.getPokemonTypes()
      const typeFilter = $("#typeFilter")

      types.forEach((type) => {
        typeFilter.append(`
          <option value="${type.name}" class="text-black">${capitalizeFirst(type.name)}</option>
        `)
      })
    } catch (error) {
      console.error("Error loading Pokemon types:", error)
    }
  }

  async function loadInitialPokemon() {
    if (isLoading) return

    isLoading = true
    showLoading("loadingSpinner")

    try {
      console.log("Loading initial Pokemon...")

      const pokemonList = await pokemonAPI.getPokemonList(pokemonPerPage, currentOffset)
      console.log("Pokemon list received:", pokemonList)

      const pokemonDetails = await pokemonAPI.loadPokemonBatch(pokemonList.results)
      console.log("Pokemon details loaded:", pokemonDetails.length)

      allLoadedPokemon = [...allLoadedPokemon, ...pokemonDetails]
      filteredPokemon = [...allLoadedPokemon]

      renderPokemonGrid(pokemonDetails)

      currentOffset += pokemonPerPage

      if (pokemonList.next) {
        $("#loadMoreBtn").removeClass("hidden")
      }
    } catch (error) {
      console.error("Error loading initial Pokemon:", error)
      showError("Error al cargar los Pokémon. Por favor, intenta de nuevo.")
    } finally {
      hideLoading("loadingSpinner")
      isLoading = false
    }
  }

  // Load more Pokemon
  async function loadMorePokemon() {
    if (isLoading) return

    isLoading = true
    const loadMoreBtn = $("#loadMoreBtn")
    const originalText = loadMoreBtn.html()

    loadMoreBtn.html('<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...')

    try {
      const pokemonList = await pokemonAPI.getPokemonList(pokemonPerPage, currentOffset)
      const pokemonDetails = await pokemonAPI.loadPokemonBatch(pokemonList.results)

      allLoadedPokemon = [...allLoadedPokemon, ...pokemonDetails]

      applyFilters()

      currentOffset += pokemonPerPage

      if (!pokemonList.next) {
        $("#loadMoreBtn").addClass("hidden")
      }
    } catch (error) {
      console.error("Error loading more Pokemon:", error)
      showError("Error al cargar más Pokémon.")
    } finally {
      loadMoreBtn.html(originalText)
      isLoading = false
    }
  }

  // Render Pokemon grid
  function renderPokemonGrid(pokemonList, append = true) {
    const grid = $("#pokemonGrid")

    if (!append) {
      grid.empty()
    }

    pokemonList.forEach((pokemon) => {
      const pokemonCard = createPokemonCard(pokemon)
      grid.append(pokemonCard)
    })

    $(".pokemon-card").each(function (index) {
      $(this).css("animation-delay", `${index * 0.1}s`)
    })
  }

  function createPokemonCard(pokemon) {
    const types = pokemon.types
      .map(
        (type) =>
          `<span class="type-badge ${getTypeColorClass(type.type.name)}">${capitalizeFirst(type.type.name)}</span>`,
      )
      .join("")

    const imageUrl = getPokemonArtworkUrl(pokemon.id)
    const fallbackUrl = getPokemonImageUrl(pokemon.id)

    return `
      <div class="pokemon-card bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-white/20" 
           data-pokemon-id="${pokemon.id}"
           data-aos="fade-up">
        <div class="text-center">
          <div class="relative mb-4">
            <img src="${imageUrl}" 
                 alt="${formatPokemonName(pokemon.name)}"
                 class="w-32 h-32 mx-auto object-contain transition-transform duration-300 hover:scale-110"
                 onerror="this.src='${fallbackUrl}'"
                 loading="lazy">
            <div class="absolute top-2 right-2 bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full border border-white/30">
              #${formatPokemonId(pokemon.id)}
            </div>
          </div>
          
          <h3 class="text-xl font-bold text-white mb-2">
            ${formatPokemonName(pokemon.name)}
          </h3>
          
          <div class="flex flex-wrap justify-center mb-3">
            ${types}
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm text-white/80">
            <div>
              <i class="fas fa-ruler-vertical mr-1"></i>
              ${formatHeight(pokemon.height)}
            </div>
            <div>
              <i class="fas fa-weight mr-1"></i>
              ${formatWeight(pokemon.weight)}
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-white/20">
            <div class="flex justify-between items-center text-xs text-white/70">
              <span>Experiencia Base</span>
              <span class="font-semibold">${pokemon.base_experience || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function setupEventListeners() {
    setupLegendaryPokemonEvents()
    setupMobileLegendaryPokemonEvents()

    setupMobileMenu()
    setupMobileNavbarSwitching()

    $("#pokeball-container").on("click", () => {
      if (selectedPokemon) {
        resetPokeball()
      }
    })

    $("#pokeball-container-mobile").on("click", () => {
      resetPokeballMobile()
    })

    const searchInput = $("#searchInput")
    const debouncedSearch = debounce(handleSearch, 300)
    searchInput.on("input", debouncedSearch)

    $("#typeFilter, #sortBy").on("change", applyFilters)
    $("#heightFilter, #weightFilter").on("input", debounce(applyFilters, 300))

    $("#loadMoreBtn").on("click", loadMorePokemon)

    $(document).on("click", ".pokemon-card", function () {
      const pokemonId = $(this).data("pokemon-id")
      showPokemonModal(pokemonId)
    })

    $(document).on("click", "#featuredPokemon", function (e) {
      if (e.target === this) {
        closeFeaturedPokemon()
      }
    })

    $('a[href^="#"]').on("click", function (e) {
      e.preventDefault()
      const target = $(this.getAttribute("href"))
      if (target.length) {
        $("html, body").animate(
          {
            scrollTop: target.offset().top - 80,
          },
          800,
        )
      }
    })
  }

  async function handleSearch() {
    const query = $("#searchInput").val().trim().toLowerCase()

    if (query === "") {
      filteredPokemon = [...allLoadedPokemon]
      renderPokemonGrid(filteredPokemon, false)
      return
    }

    const localResults = allLoadedPokemon.filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.id.toString() === query ||
        pokemon.types.some((type) => type.type.name.toLowerCase().includes(query)),
    )

    if (localResults.length > 0) {
      filteredPokemon = localResults
      renderPokemonGrid(filteredPokemon, false)
    } else {
      // Busqueda por nombre
      try {
        showLoading("loadingSpinner")
        const pokemon = await pokemonAPI.searchPokemon(query)

        if (pokemon) {
          filteredPokemon = [pokemon]
          renderPokemonGrid(filteredPokemon, false)
        } else {
          $("#pokemonGrid").html(`
            <div class="col-span-full text-center py-12">
              <div class="text-white/60 text-6xl mb-4">
                <i class="fas fa-search"></i>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">No se encontraron resultados</h3>
              <p class="text-white/80">Intenta buscar con otro término</p>
            </div>
          `)
        }
      } catch (error) {
        console.error("Error searching Pokemon:", error)
        showError("Error al buscar Pokémon.")
      } finally {
        hideLoading("loadingSpinner")
      }
    }
  }

  function applyFilters() {
    const typeFilter = $("#typeFilter").val()
    const sortBy = $("#sortBy").val()
    const maxHeight = Number.parseInt($("#heightFilter").val())
    const maxWeight = Number.parseInt($("#weightFilter").val())

    let filtered = [...allLoadedPokemon]

    // filters
    if (typeFilter) {
      filtered = filtered.filter((pokemon) => pokemon.types.some((type) => type.type.name === typeFilter))
    }

    filtered = filtered.filter((pokemon) => pokemon.height <= maxHeight)

    filtered = filtered.filter((pokemon) => pokemon.weight <= maxWeight)

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "height":
          return b.height - a.height
        case "weight":
          return b.weight - a.weight
        case "id":
        default:
          return a.id - b.id
      }
    })

    filteredPokemon = filtered
    renderPokemonGrid(filteredPokemon, false)
  }

  function openPokemonDetail(pokemonId) {
    window.location.href = `pokemon-detail.html?id=${pokemonId}`
  }

  function closeFeaturedPokemon() {
    $("#featuredPokemon").removeClass("show")
  }

  window.scrollToPokemon = () => {
    $("html, body").animate(
      {
        scrollTop: $("#pokemon").offset().top - 80,
      },
      800,
    )
  }

  window.openPokemonDetail = openPokemonDetail
  window.closeFeaturedPokemon = closeFeaturedPokemon

  // Mostrar modal de Pokémon
  async function showPokemonModal(pokemonId) {
    try {
      // Obtener datos del Pokémon
      const pokemon = await pokemonAPI.getPokemonDetails(pokemonId)

      // Actualizar contenido del modal
      $("#modalPokemonImg").attr("src", getPokemonArtworkUrl(pokemon.id))
      $("#modalPokemonName").text(formatPokemonName(pokemon.name))
      $("#modalPokemonId").text(`#${formatPokemonId(pokemon.id)}`)

      // Tipos
      const types = pokemon.types
        .map(
          (type) =>
            `<span class="type-badge ${getTypeColorClass(type.type.name)}">${capitalizeFirst(type.type.name)}</span>`,
        )
        .join("")
      $("#modalPokemonTypes").html(types)

      // Estadísticas
      const statsHTML = pokemon.stats
        .map(
          (stat) => `
          <div class="stat-item">
            <div class="stat-value">${stat.base_stat}</div>
            <div class="stat-label">${formatStatName(stat.stat.name)}</div>
          </div>
        `,
        )
        .join("")
      $("#modalPokemonStats").html(statsHTML)

      // Habilidades
      const abilitiesHTML = pokemon.abilities
        .map(
          (ability) => `
          <span class="ability-badge">${formatPokemonName(ability.ability.name)}</span>
        `,
        )
        .join("")
      $("#modalPokemonAbilities").html(abilitiesHTML)

      // Información adicional
      $("#modalPokemonHeight").text(formatHeight(pokemon.height))
      $("#modalPokemonWeight").text(formatWeight(pokemon.weight))
      $("#modalPokemonExp").text(pokemon.base_experience || "N/A")
      $("#modalPokemonMoves").text(pokemon.moves.length)

      $("#viewDetailsBtn")
        .off("click")
        .on("click", () => {
          openPokemonDetail(pokemon.id)
        })

      $("#pokemonModal").addClass("show")

      // Prevenir scroll del body
      $("body").css("overflow", "hidden")
    } catch (error) {
      console.error("Error al mostrar modal de Pokémon:", error)
      showError("Error al cargar los datos del Pokémon")
    }
  }

  // Cerrar modal de Pokémon
  function closePokemonModal() {
    $("#pokemonModal").removeClass("show")
    $("body").css("overflow", "auto")
  }

  // Función para formatear el nombre de la estadística
  function formatStatName(statName) {
    const statNames = {
      hp: "HP",
      attack: "Ataque",
      defense: "Defensa",
      "special-attack": "At. Especial",
      "special-defense": "Def. Especial",
      speed: "Velocidad",
    }
    return statNames[statName] || capitalizeFirst(statName)
  }

  window.closePokemonModal = closePokemonModal

  $(document).on("click", "#pokemonModal", (e) => {
    if ($(e.target).is($("#pokemonModal"))) {
      closePokemonModal()
    }
  })

  $(document).keydown((e) => {
    if (e.key === "Escape" && $("#pokemonModal").hasClass("show")) {
      closePokemonModal()
    }
  })
})
