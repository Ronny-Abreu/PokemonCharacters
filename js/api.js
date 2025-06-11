const API_BASE_URL = "https://pokeapi.co/api/v2"

class PokemonAPI {
  constructor() {
    this.cache = new Map()
    this.pokemonTypes = []
    this.allPokemon = []
  }

  async getPokemonList(limit = 20, offset = 0) {
    const cacheKey = `pokemon-list-${limit}-${offset}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`)
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
  }

  async getPokemonDetails(pokemonId) {
    const cacheKey = `pokemon-${pokemonId}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pokemon/${pokemonId}`)
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
  }

  async getPokemonSpecies(pokemonId) {
    const cacheKey = `species-${pokemonId}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pokemon-species/${pokemonId}`)
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
  }

  // Todos los tipos de pokemones
  async getPokemonTypes() {
    if (this.pokemonTypes.length > 0) {
      return this.pokemonTypes
    }

    try {
      const response = await fetch(`${API_BASE_URL}/type`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.pokemonTypes = data.results
      return this.pokemonTypes
    } catch (error) {
      console.error("Error fetching Pokemon types:", error)
      throw error
    }
  }

  // Por tipo
  async getPokemonByType(typeName) {
    const cacheKey = `type-${typeName}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/type/${typeName}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.cache.set(cacheKey, data)
      return data
    } catch (error) {
      console.error(`Error fetching Pokemon by type ${typeName}:`, error)
      throw error
    }
  }

  // Por nombre
  async searchPokemon(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/pokemon/${query.toLowerCase()}`)
      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`Error searching Pokemon ${query}:`, error)
      return null
    }
  }

  async getEvolutionChain(speciesUrl) {
    try {
      const speciesResponse = await fetch(speciesUrl)
      const speciesData = await speciesResponse.json()

      const evolutionResponse = await fetch(speciesData.evolution_chain.url)
      const evolutionData = await evolutionResponse.json()

      return evolutionData
    } catch (error) {
      console.error("Error fetching evolution chain:", error)
      throw error
    }
  }

  // CAPTURA ERROR CARGA POKEMON
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

    const results = await Promise.allSettled(promises)
    return results
      .filter((result) => result.status === "fulfilled" && result.value !== null)
      .map((result) => result.value)
  }

  extractIdFromUrl(url) {
    const matches = url.match(/\/(\d+)\/$/)
    return matches ? Number.parseInt(matches[1]) : null
  }

  clearCache() {
    this.cache.clear()
  }

  getCacheSize() {
    return this.cache.size
  }
}

const pokemonAPI = new PokemonAPI()
