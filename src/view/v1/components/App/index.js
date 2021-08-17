import './index.less'

/**
 * @typedef {{start: number; end: number}} TimeRange
 * @typedef {{text: string; timeRanges: TimeRange[]}} Item
 */

class App {
  static new () {
    return new this()
  }

  constructor() {
    /** @type {Item | null} */
    this.currentItem = null
    /** @type {Item[]} */
    this.savedItems = []
    /** @type {HTMLElement} */
    this.elt = null

    this.running = true

    this.updateStatus()
  }

  /**
   *
   * @param {KeyboardEvent} e 输入事件
   */
  onTextareaChange = (e) => {
    // enter 键表示创建事件，不输入
    if (e.keyCode === 13) {
      e.preventDefault()
      let input = e.target
      let v = input.value
      if (v.trim().length !== 0) {
        this.createItem(input.value)
        input.value = ''
      }
    }
  }

  createItem(text) {
    let now = Date.now()
    if (this.currentItem) {
      let newItem = this.currentItem
      let lastRange = newItem.timeRanges[newItem.timeRanges.length - 1]

      // 这里的 lastRange 可能是处于暂停状态的
      // 暂停状态的时候，当前记录已经保存了结束时间了，不需要更新
      if (!lastRange.end) {
        lastRange.end = now
      }

      this.savedItems.push(newItem)
    }

    console.log(this.savedItems, this.currentItem)

    this.currentItem = {
      text,
      timeRanges: [
        { start: now },
      ],
    }

    this.updateStatus(true)
    this.update()
  }

  pause = () => {
    if (this.currentItem) {
      let now = Date.now()
      let timeRanges = this.currentItem.timeRanges
      let lastRange = timeRanges[timeRanges.length - 1]
      lastRange.end = now
    }

    this.updateStatus(false)
  }

  start = () => {
    if (this.currentItem) {
      let now = Date.now()
      let newRange = { start: now }
      this.currentItem.timeRanges.push(newRange)
    }

    this.updateStatus(true)
  }

  finish = () => {
    if (this.currentItem) {
      let now = Date.now()
      let timeRanges = this.currentItem.timeRanges
      let lastRange = timeRanges[timeRanges.length - 1]
      lastRange.end = now

      this.savedItems.push(this.currentItem)
      this.currentItem = null
      this.update()
    }

    this.updateStatus(false)
  }

  update() {
    let itemList = this.elt.querySelector('.item-list')

    const padStart = (v, length, filler = '0') => {
      v = String(v)
      while (v.length < length) {
        v = filler + v
      }

      return v
    }

    const formatTime = (n) => {
      let date = new Date(n)
      let hour = padStart(date.getHours(), 2)
      let minutes = padStart(date.getMinutes(), 2)
      return `${hour}:${minutes}`
    }

    /**
     * @param {Item} item .
     */
    const renderItem = (item) => {
      let timeRange = item.timeRanges
        .map((range) => {
          let text = `${formatTime(range.start)}~`
          if (range.end) {
            text += `${formatTime(range.end)}`
          }
          return `<div>${text}</div>`
        })
        .join('')

      let consumed = 0
      item.timeRanges.forEach((range) => {
        if (range.start && range.end) {
          consumed += range.end - range.start
        }
      })
      let seconds = Math.floor(consumed / 1000)
      let minutes = Math.floor(seconds / 60)
      seconds = seconds % 60

      let timeCount = ''
      if (minutes) {
        timeCount += `${minutes}m`
      }

      if (seconds) {
        timeCount += `${seconds}s`
      }

      return `
        <div>
          <span>${timeRange}</span>
          <span>${timeCount}</span>
          <span>${item.text}</span>
        </div>
      `
    }

    let html = `
    <div>
      <span>时间段</span>
      <span>计时</span>
      <span>描述</span>
    </div>
    ${this.savedItems.map(renderItem).join('')}
    ${this.currentItem ? renderItem(this.currentItem) : ''}
    `

    itemList.innerHTML = html
  }

  updateStatus(v) {
    if (this.elt) {
      let status = this.elt.querySelector('.editor-status-text')
      status.innerHTML = v ? '计时中...' : '计时暂停'
    }

    this.running = v
  }

  attach(element) {
    let div = document.createElement('div')
    div.id = 'app'

    div.innerHTML = `
      <div>
        <div class="editor-status">状态: <span class="editor-status-text"></span></div>
        <button class="btn-stop">暂停计时</button>
        <button class="btn-start">开始计时</button>
        <button class="btn-finish">结束当前任务</button>
      </div>
      <div class="content-area">
        <textarea class="item-input"></textarea>
        <div class="item-list">
          <div>
            <span>时间段</span>
            <span>计时</span>
            <span>描述</span>
          </div>
        </div>
      </div>
    `

    /** @type {HTMLTextAreaElement} */
    let input = div.querySelector('.item-input')
    input.addEventListener('keydown', this.onTextareaChange)

    let stopBtn = div.querySelector('.btn-stop')
    let startBtn = div.querySelector('.btn-start')
    let startFinish = div.querySelector('.btn-finish')
    stopBtn.addEventListener('click', this.pause)
    startBtn.addEventListener('click', this.start)
    startFinish.addEventListener('click', this.finish)

    element.appendChild(div)

    this.elt = div
    this.updateStatus(true)
  }
}

export default App
