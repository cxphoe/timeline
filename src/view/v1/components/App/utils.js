export const database = {
  key: 'tl-data',
  save(data) {
    let str = JSON.stringify(data)
    localStorage.setItem(this.key, str)
  },
  load() {
    let str = localStorage.getItem(this.key)
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  },
  clear() {
    localStorage.removeItem(this.key)
  },
};
