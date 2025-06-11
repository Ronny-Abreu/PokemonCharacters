// Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatPokemonName(name) {
  return name
    .split("-")
    .map((word) => capitalizeFirst(word))
    .join(" ")
}

// Pokemon imagen URL
function getPokemonImageUrl(id, shiny = false) {
  const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
  const folder = shiny ? "shiny" : ""
  return `${baseUrl}/${folder}/${id}.png`
}

// Get Pokemon official artwork URL
function getPokemonArtworkUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function getTypeColorClass(type) {
  return `type-${type.toLowerCase()}`
}

// por altura
function formatHeight(height) {
  return (height / 10).toFixed(1) + " m"
}

// Por peso
function formatWeight(weight) {
  return (weight / 10).toFixed(1) + " kg"
}

// Format stat name
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

function getStatColor(value) {
  if (value >= 100) return "#4ade80" // green
  if (value >= 80) return "#facc15" // yellow
  if (value >= 60) return "#fb923c" // orange
  return "#ef4444" // red
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function scrollToElement(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

// Scroll a la seccion de  Pokemones
function scrollToPokemon() {
  scrollToElement("pokemon")
}

// loading state
function showLoading(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.remove("hidden")
  }
}

// Hide loading state
function hideLoading(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.classList.add("hidden")
  }
}

// error message
function showError(message, containerId = "pokemonGrid") {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-500 text-6xl mb-4">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="text-2xl font-bold text-black-olive mb-2">¡Oops! Algo salió mal</h3>
                <p class="text-black-olive mb-4">${message}</p>
                <button onclick="location.reload()" class="bg-black-olive text-white px-6 py-3 rounded-full hover:bg-dark-green transition-colors">
                    <i class="fas fa-refresh mr-2"></i>
                    Intentar de nuevo
                </button>
            </div>
        `
  }
}

// Get URL parametros
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

// Set URL parametros
function setUrlParameter(name, value) {
  const url = new URL(window.location)
  url.searchParams.set(name, value)
  window.history.pushState({}, "", url)
}

//  Pokemon con leading
function formatPokemonId(id) {
  return String(id).padStart(3, "0")
}

// Confirmar si la imagen existe
function imageExists(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

function getFallbackImage() {
  return "/placeholder.svg?height=200&width=200"
}

// Animate number counting
function animateNumber(element, start, end, duration = 1000) {
  const range = end - start
  const increment = range / (duration / 16)
  let current = start

  const timer = setInterval(() => {
    current += increment
    if (current >= end) {
      current = end
      clearInterval(timer)
    }
    element.textContent = Math.floor(current)
  }, 16)
}

// Local storage helpers
const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  },

  get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return null
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("Error removing from localStorage:", error)
    }
  },
}

// Performance monitoring
const Performance = {
  start(label) {
    console.time(label)
  },

  end(label) {
    console.timeEnd(label)
  },

  mark(name) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name)
    }
  },
}
