import './index.less'
import { database } from './utils'

/**
 * @typedef {{start: number; end: number}} TimeRange
 * @typedef {{id: string; text: string; timeRanges: TimeRange[]}} Item
 */

const isDev = process.env.NODE_ENV === 'development'

let timer = null

const log = console.log

const sum = (...nums) => {
  let res = 0
  for (let n of nums) {
    res += n
  }
  return res
}

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
    /** @type {Set<string>} */
    this.selectedItems = new Set()

    this.running = true

    this.updateStatus()

    isDev && this.debug()
    this.load()
  }

  debug() {
    this.savedItems = [
      {
        id: '1',
        text: 'test 111',
        timeRanges: [{
          start: Date.now() - 1000 * 1000,
          end: Date.now(),
        }],
      },
      {
        id: '2',
        text: 'test 333',
        timeRanges: [{
          start: Date.now() - 1000 * 1000,
          end: Date.now(),
        }],
      },
    ]
    this.selectedItems.add('1')
    this.selectedItems.add('2')
  }

  load() {
    const data = database.load()

    if (data) {
      this.savedItems = data.saved || []
      this.currentItem = data.current || null
    }
  }

  loopSave() {
    const data = {
      saved: this.savedItems,
      current: this.currentItem,
    }

    database.save(data)

    timer = setTimeout(() => {
      this.loopSave()
    }, 1000);
  }

  clearData = () => {
    database.clear()
    this.savedItems = []
    this.currentItem = null
    this.pause = true
    this.update()
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

  uid() {
    return `${Math.random().toString().slice(-5, -1)}-${Date.now().toString().slice(-4)}`
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
      id: this.uid(),
      text,
      timeRanges: [
        { start: now },
      ],
    }
    this.selectedItems.add(this.currentItem.id)

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

  bindListEvents(elt) {
    let elts = elt.querySelectorAll('div[contenteditable]')

    elts.forEach((e) => {
      e.addEventListener('blur', (event) => {
        let item = e.closest('.timeline-item')
        let id = item.dataset.id

        let edited = null
        if (this.currentItem && this.currentItem.id === id) {
          edited = this.currentItem
        } else {
          edited = this.savedItems.find((i) => i.id === id)
        }

        if (edited) {
          let text = event.target.innerHTML
          edited.text = text
        }
      })
    })
  }

  onListClick = (e) => {
    /** @type {HTMLElement} */
    let elt = e.target
    let item = elt.closest('.timeline-item')

    if (item) {
      let id = item.dataset.id

      if (
        !elt.classList.contains('timeline-item-text') &&
        !elt.parentElement.classList.contains('timeline-item-text')
      ) {
        if (this.selectedItems.has(id)) {
          this.selectedItems.delete(id)
        } else {
          this.selectedItems.add(id)
        }

        this.update()
      }
    }
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

    const formatMilliseconds = (n) => {
      let seconds = Math.floor(n / 1000)
      let minutes = Math.floor(seconds / 60)
      seconds = seconds % 60

      let timeCount = ''
      if (minutes) {
        timeCount += `${minutes}m`
      }

      if (seconds) {
        timeCount += `${seconds}s`
      }
      return timeCount
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

      let timeCount = formatMilliseconds(consumed)

      return `
        <div
          class="timeline-item ${this.selectedItems.has(item.id) ? 'selected' : ''}"
          data-id="${item.id}"
        >
          <span>${timeRange}</span>
          <div class="timeline-item-text" contenteditable="true">${item.text}</div>
          <span>${timeCount}</span>
        </div>
      `
    }

    let selected = this.savedItems.filter((item) => this.selectedItems.has(item.id))
    let totalTime = sum(...selected.map((item) => {
      let s = sum(
        ...item.timeRanges.map((range) => {
          return range.end - range.start
        })
      )
      return s
    }))
    let totalTimeText = formatMilliseconds(totalTime)

    let html = `
    <div>
      <span>时间段</span>
      <span>描述</span>
      <span>计时</span>
    </div>
    ${this.savedItems.map(renderItem).join('')}
    ${this.currentItem ? renderItem(this.currentItem) : ''}
    <div class="timeline-stat-item">
      <span>统计选中项时间</span>
      <span>${totalTimeText}</span>
      <span></span>
    </div>
    `

    itemList.innerHTML = html

    this.bindListEvents(itemList)
  }

  updateTotal() {

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
        <button class="btn-cleardata">清除数据</button>
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
    let clear = div.querySelector('.btn-cleardata')
    stopBtn.addEventListener('click', this.pause)
    startBtn.addEventListener('click', this.start)
    startFinish.addEventListener('click', this.finish)
    clear.addEventListener('click', this.clearData)

    let itemList = div.querySelector('.item-list')
    itemList.addEventListener('click', this.onListClick)


    element.appendChild(div)

    this.elt = div
    this.updateStatus(true)
    this.update()

    this.loopSave()
  }
}

export default App
