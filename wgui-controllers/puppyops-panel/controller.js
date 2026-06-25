const css = `
  :host, .puppyops-panel {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
  }
  .puppyops-panel {
    position: relative;
    overflow: hidden;
    background: #08111d;
  }
  .puppyops-panel__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
`

const roundedRect = (ctx, x, y, width, height, radius = 4) => {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const installRightPanelResizeHandleOverrides = () => {
  if (window.__puppyOpsRightPanelResizeHandleOverridesInstalled) return
  window.__puppyOpsRightPanelResizeHandleOverridesInstalled = true

  const parsePixels = (value) => {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const configureLeftHandle = (panel) => {
    if (!(panel instanceof HTMLElement)) return

    const handle = Array.from(panel.children).find((child) =>
      child instanceof HTMLElement && child.classList.contains("wgui-resize-handle")
    )
    if (!(handle instanceof HTMLElement)) return

    handle.classList.add("puppyops-left-resize-handle")
    handle.style.left = "0"
    handle.style.right = "auto"
    handle.style.cursor = "col-resize"
    handle.style.zIndex = "30"
    if (handle.dataset.puppyOpsResizeSide === "left") return
    handle.dataset.puppyOpsResizeSide = "left"

    handle.onmousedown = (event) => {
      event.preventDefault()
      event.stopPropagation()
      const startX = event.clientX
      const startWidth = panel.getBoundingClientRect().width
      const computed = window.getComputedStyle(panel)
      const minWidth = parsePixels(computed.minWidth)
      const maxWidth = parsePixels(computed.maxWidth)

      const onMove = (moveEvent) => {
        let width = startWidth + (startX - moveEvent.clientX)
        if (minWidth && width < minWidth) width = minWidth
        if (maxWidth && width > maxWidth) width = maxWidth
        panel.style.width = `${width}px`
      }

      const onUp = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }

      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    }
  }

  const apply = () => {
    const appRows = Array.from(document.querySelectorAll("body > .flex-col > .flex-row"))
    const workRow = appRows.find((row) => row instanceof HTMLElement && row.children.length >= 5)
    if (!(workRow instanceof HTMLElement)) return

    configureLeftHandle(workRow.children[3])
    configureLeftHandle(workRow.children[4])
  }

  apply()
  const observer = new MutationObserver(apply)
  observer.observe(document.body, { childList: true, subtree: true })
}

export default class PuppyOpsPanelController {
  constructor(element) {
    this.element = element
    this.root = document.createElement("div")
    this.root.className = "puppyops-panel"
    installRightPanelResizeHandleOverrides()

    const style = document.createElement("style")
    style.textContent = css
    this.root.appendChild(style)

    this.canvas = document.createElement("canvas")
    this.canvas.className = "puppyops-panel__canvas"
    this.root.appendChild(this.canvas)

    this.referenceLoaded = false
    this.referenceImage = new Image()
    this.referenceImage.decoding = "async"
    this.referenceImage.onload = () => {
      this.referenceLoaded = true
      this.draw()
    }
    this.referenceImage.src = "/fs/target.png"
    this.referenceBitmap = null
    fetch("/fs/target.png")
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob))
      .then((bitmap) => {
        this.referenceBitmap = bitmap
        this.draw()
      })
      .catch(() => {})

    this.resizeObserver = new ResizeObserver(() => this.draw())
  }

  mount(props) {
    this.element.replaceChildren(this.root)
    this.resizeObserver.observe(this.element)
    this.setProps(props)
  }

  setProps(props) {
    this.props = props ?? {}
    this.draw()
  }

  dispose() {
    this.resizeObserver.disconnect()
    this.element.replaceChildren()
  }

  draw() {
    const rect = this.element.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }

    const ctx = this.canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const rawMode = this.props?.mode
    const mode = typeof rawMode === "string" ? rawMode : (rawMode?.String ?? rawMode?.string ?? "live")
    if (this.drawReferenceCrop(ctx, rect, mode)) return
    if (mode === "mission_map") this.drawMissionMap(ctx, rect)
    else if (mode === "replay_map") this.drawReplayMap(ctx, rect)
    else if (mode === "replay_timeline") this.drawReplayTimeline(ctx, rect)
    else if (mode === "fleet_map") this.drawFleetMap(ctx, rect)
    else if (mode === "diagnostic_chart" || mode === "growth" || mode === "telemetry") this.drawLineChart(ctx, rect)
    else if (mode === "dataset_lidar") this.drawDatasetLidar(ctx, rect)
    else if (mode === "replay_video") this.drawReplayVideo(ctx, rect)
    else if (mode === "robot") this.drawRobotPreview(ctx, rect)
    else if (mode === "map") this.drawMap(ctx, rect)
    else if (mode === "arm") this.drawArm(ctx, rect)
    else if (mode === "hand") this.drawHand(ctx, rect)
    else if (mode === "timeline") this.drawTimeline(ctx, rect)
    else if (mode === "depth") this.drawDepth(ctx, rect)
    else if (mode === "lidar") this.drawLidar(ctx, rect)
    else if (mode === "left_hand" || mode === "right_hand") this.drawHandCamera(ctx, rect, mode)
    else if (mode === "front_rgb") this.drawMiniCamera(ctx, rect)
    else if (mode === "split_donut") this.drawDonut(ctx, rect)
    else this.drawLive(ctx, rect)
  }

  referenceCrop(mode) {
    const crops = {
      live: [347, 87, 776, 637],
      robot: [81, 86, 258, 267],
      map: [1354, 86, 308, 284],
      arm: [1138, 315, 198, 136],
      hand: [1138, 492, 198, 128],
      timeline: [863, 760, 565, 151],
      front_rgb: [12, 787, 111, 139],
      depth: [129, 787, 111, 139],
      lidar: [244, 787, 111, 139],
      left_hand: [361, 787, 111, 139],
      right_hand: [484, 787, 111, 139],
    }
    return crops[mode]
  }

  drawReferenceCrop(ctx, rect, mode) {
    const source = this.referenceBitmap ?? (
      this.referenceLoaded || (this.referenceImage.complete && this.referenceImage.naturalWidth > 0)
        ? this.referenceImage
        : null
    )
    if (!source) return false
    const crop = this.referenceCrop(mode)
    if (!crop) return false
    const [sx, sy, sw, sh] = crop
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, rect.width, rect.height)
    return true
  }

  drawWarehouse(ctx, rect) {
    const bg = ctx.createLinearGradient(0, 0, 0, rect.height)
    bg.addColorStop(0, "#3f4650")
    bg.addColorStop(0.5, "#5b5954")
    bg.addColorStop(1, "#4a453e")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, rect.width, rect.height)

    ctx.fillStyle = "rgba(255,255,255,0.16)"
    for (let i = 0; i < 12; i += 1) {
      const x = (i + 0.3) * rect.width / 12
      ctx.fillRect(x, 0, rect.width / 28, rect.height * 0.08)
    }

    ctx.fillStyle = "rgba(18, 22, 26, 0.42)"
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 73) % rect.width
      const y = rect.height * (0.18 + ((i * 37) % 24) / 100)
      roundedRect(ctx, x, y, rect.width * 0.08, rect.height * 0.18, 2)
      ctx.fill()
    }

    ctx.strokeStyle = "rgba(255, 192, 76, 0.55)"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.12, rect.height)
    ctx.lineTo(rect.width * 0.42, rect.height * 0.55)
    ctx.moveTo(rect.width * 0.02, rect.height * 0.8)
    ctx.lineTo(rect.width * 0.72, rect.height * 0.48)
    ctx.stroke()
  }

  drawLive(ctx, rect) {
    this.drawWarehouse(ctx, rect)
    this.drawRover(ctx, rect.width * 0.18, rect.height * 0.67, Math.min(rect.width, rect.height) * 0.2)
    this.drawHumanoid(ctx, rect.width * 0.62, rect.height * 0.52, Math.min(rect.width, rect.height) * 0.56)

    ctx.strokeStyle = "#49df6a"
    ctx.lineWidth = 4
    ctx.setLineDash([12, 10])
    ctx.beginPath()
    ctx.moveTo(0, rect.height * 0.86)
    ctx.bezierCurveTo(rect.width * 0.34, rect.height * 0.72, rect.width * 0.64, rect.height * 0.66, rect.width * 0.86, rect.height * 0.48)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = "rgba(255,255,255,0.82)"
    ctx.lineWidth = 2
    const cx = rect.width * 0.45
    const cy = rect.height * 0.5
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.beginPath()
      ctx.moveTo(cx + sx * 38, cy + sy * 24)
      ctx.lineTo(cx + sx * 22, cy + sy * 24)
      ctx.moveTo(cx + sx * 38, cy + sy * 24)
      ctx.lineTo(cx + sx * 38, cy + sy * 8)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(cx - 12, cy)
    ctx.lineTo(cx + 12, cy)
    ctx.moveTo(cx, cy - 12)
    ctx.lineTo(cx, cy + 12)
    ctx.stroke()

    ctx.fillStyle = "rgba(7, 13, 20, 0.78)"
    roundedRect(ctx, 16, 16, 132, 72, 4)
    ctx.fill()
    ctx.fillStyle = "#36d67a"
    ctx.font = "700 13px system-ui"
    ctx.fillText("TELEOP ACTIVE", 28, 38)
    ctx.fillStyle = "#dce7f3"
    ctx.font = "12px system-ui"
    ctx.fillText("MODE:   MANUAL", 28, 58)
    ctx.fillText("SPEED:  0.75x", 28, 76)

    ctx.fillStyle = "#49df6a"
    ctx.font = "700 18px system-ui"
    ctx.fillText("4.2 m", rect.width * 0.78, rect.height * 0.58)
  }

  drawRobotPreview(ctx, rect) {
    const bg = ctx.createLinearGradient(0, 0, 0, rect.height)
    bg.addColorStop(0, "#101b28")
    bg.addColorStop(1, "#07101a")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "rgba(79, 114, 146, 0.22)"
    ctx.lineWidth = 1
    for (let i = 0; i < 12; i += 1) {
      const y = rect.height * 0.72 + i * 14
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y + i * 3)
      ctx.stroke()
    }
    this.drawHumanoid(ctx, rect.width * 0.52, rect.height * 0.54, Math.min(rect.width, rect.height) * 0.72)
  }

  drawHumanoid(ctx, cx, cy, scale) {
    const s = scale / 240
    ctx.lineCap = "round"
    ctx.strokeStyle = "#111820"
    ctx.lineWidth = 15 * s
    ctx.beginPath()
    ctx.moveTo(cx - 28 * s, cy + 28 * s)
    ctx.lineTo(cx - 68 * s, cy + 104 * s)
    ctx.lineTo(cx - 88 * s, cy + 150 * s)
    ctx.moveTo(cx + 28 * s, cy + 28 * s)
    ctx.lineTo(cx + 62 * s, cy + 104 * s)
    ctx.lineTo(cx + 82 * s, cy + 150 * s)
    ctx.moveTo(cx - 40 * s, cy - 54 * s)
    ctx.lineTo(cx - 95 * s, cy - 4 * s)
    ctx.lineTo(cx - 108 * s, cy + 54 * s)
    ctx.moveTo(cx + 40 * s, cy - 54 * s)
    ctx.lineTo(cx + 100 * s, cy - 6 * s)
    ctx.lineTo(cx + 128 * s, cy + 42 * s)
    ctx.stroke()
    ctx.strokeStyle = "#7f8b9b"
    ctx.lineWidth = 9 * s
    ctx.stroke()

    ctx.fillStyle = "#647080"
    roundedRect(ctx, cx - 44 * s, cy - 82 * s, 88 * s, 104 * s, 4 * s)
    ctx.fill()
    ctx.strokeStyle = "#202c38"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#9ba8b7"
    roundedRect(ctx, cx - 34 * s, cy - 128 * s, 68 * s, 42 * s, 3 * s)
    ctx.fill()
    ctx.fillStyle = "#865b23"
    roundedRect(ctx, cx - 42 * s, cy - 164 * s, 84 * s, 34 * s, 3 * s)
    ctx.fill()
    ctx.fillStyle = "#1d2733"
    roundedRect(ctx, cx - 95 * s, cy + 150 * s, 42 * s, 14 * s, 3 * s)
    roundedRect(ctx, cx + 60 * s, cy + 150 * s, 42 * s, 14 * s, 3 * s)
    ctx.fill()
    ctx.fillStyle = "#0e151d"
    ctx.font = `${15 * s}px system-ui`
    ctx.fillText("PuppyBot", cx - 34 * s, cy - 35 * s)
  }

  drawRover(ctx, cx, cy, scale) {
    const s = scale / 100
    ctx.fillStyle = "#17212c"
    roundedRect(ctx, cx - 58 * s, cy - 25 * s, 116 * s, 50 * s, 8 * s)
    ctx.fill()
    ctx.fillStyle = "#2d3742"
    roundedRect(ctx, cx - 42 * s, cy - 45 * s, 84 * s, 26 * s, 6 * s)
    ctx.fill()
    ctx.fillStyle = "#5ec9ff"
    roundedRect(ctx, cx - 42 * s, cy - 4 * s, 84 * s, 8 * s, 3 * s)
    ctx.fill()
    ctx.fillStyle = "#0a0e14"
    for (const dx of [-48, -16, 16, 48]) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + 30 * s, 12 * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawMap(ctx, rect) {
    ctx.fillStyle = "#08111d"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "rgba(92, 119, 145, 0.22)"
    ctx.lineWidth = 1
    for (let x = 0; x < rect.width; x += 18) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
    for (let y = 0; y < rect.height; y += 18) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }
    const pts = [
      [0.13, 0.2], [0.34, 0.17], [0.34, 0.28], [0.47, 0.28], [0.47, 0.42],
      [0.62, 0.42], [0.62, 0.18], [0.87, 0.16], [0.87, 0.72], [0.64, 0.72],
      [0.64, 0.84], [0.18, 0.82], [0.18, 0.64], [0.09, 0.64],
    ]
    ctx.fillStyle = "rgba(108, 116, 124, 0.5)"
    ctx.strokeStyle = "#8a96a8"
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      const px = x * rect.width
      const py = y * rect.height
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = "#43d17a"
    ctx.lineWidth = 3
    ctx.setLineDash([8, 7])
    const route = [[0.28, 0.43], [0.42, 0.58], [0.66, 0.48], [0.84, 0.64]]
    ctx.beginPath()
    route.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * rect.width, y * rect.height)
      else ctx.lineTo(x * rect.width, y * rect.height)
    })
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = "#2f89ff"
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.42, rect.height * 0.58)
    ctx.lineTo(rect.width * 0.36, rect.height * 0.64)
    ctx.lineTo(rect.width * 0.46, rect.height * 0.66)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "#43d17a"
    ctx.font = "700 10px system-ui"
    route.forEach(([x, y], i) => {
      ctx.beginPath()
      ctx.arc(x * rect.width, y * rect.height, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillText(`WP-0${i + 1}`, x * rect.width - 14, y * rect.height - 10)
    })
  }

  drawBlueprint(ctx, rect) {
    ctx.fillStyle = "#07111c"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "rgba(73, 105, 136, 0.28)"
    ctx.lineWidth = 1
    for (let x = 0; x < rect.width; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
    for (let y = 0; y < rect.height; y += 24) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }
    ctx.strokeStyle = "rgba(150, 162, 176, 0.42)"
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 67) % rect.width)
      const y = ((i * 43) % rect.height)
      roundedRect(ctx, x, y, rect.width * 0.12, rect.height * 0.1, 2)
      ctx.stroke()
    }
  }

  drawMissionMap(ctx, rect) {
    this.drawBlueprint(ctx, rect)
    const pts = [
      [0.12, 0.28, "Start", "#36d67a"],
      [0.26, 0.38, "1 Navigate", "#36d67a"],
      [0.46, 0.36, "2 Pick", "#ffcf30"],
      [0.62, 0.25, "3 Navigate", "#36d67a"],
      [0.72, 0.42, "4 Place", "#4d9dff"],
      [0.82, 0.58, "5 Inspect", "#b76cff"],
      [0.88, 0.75, "6 Dock", "#ff8b22"],
    ]
    ctx.setLineDash([7, 6])
    ctx.lineWidth = 3
    ctx.strokeStyle = "#57f18b"
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * rect.width, y * rect.height)
      else ctx.lineTo(x * rect.width, y * rect.height)
    })
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = "700 12px system-ui"
    pts.forEach(([x, y, label, color]) => {
      const px = x * rect.width
      const py = y * rect.height
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#061018"
      ctx.fillText(String(label).split(" ")[0], px - 4, py + 4)
      ctx.fillStyle = "rgba(7, 17, 28, 0.9)"
      roundedRect(ctx, px + 18, py - 14, 86, 28, 4)
      ctx.fill()
      ctx.fillStyle = "#e8f3ff"
      ctx.fillText(String(label), px + 26, py + 4)
    })
  }

  drawReplayMap(ctx, rect) {
    this.drawBlueprint(ctx, rect)
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = "#4d9dff"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.2, rect.height * 0.25)
    ctx.lineTo(rect.width * 0.2, rect.height * 0.78)
    ctx.lineTo(rect.width * 0.64, rect.height * 0.78)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = "#36d67a"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.18, rect.height * 0.28)
    ctx.lineTo(rect.width * 0.42, rect.height * 0.28)
    ctx.lineTo(rect.width * 0.42, rect.height * 0.52)
    ctx.lineTo(rect.width * 0.72, rect.height * 0.52)
    ctx.lineTo(rect.width * 0.72, rect.height * 0.82)
    ctx.stroke()
    ctx.fillStyle = "#2f89ff"
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.72, rect.height * 0.82)
    ctx.lineTo(rect.width * 0.66, rect.height * 0.9)
    ctx.lineTo(rect.width * 0.78, rect.height * 0.9)
    ctx.closePath()
    ctx.fill()
  }

  drawFleetMap(ctx, rect) {
    this.drawBlueprint(ctx, rect)
    const robots = [
      [0.25, 0.22, "X1", "#4d9dff"],
      [0.55, 0.32, "X2", "#36d67a"],
      [0.82, 0.35, "X3", "#b76cff"],
      [0.20, 0.76, "X4", "#ff8b22"],
      [0.56, 0.64, "R1", "#42e1c6"],
      [0.73, 0.78, "R2", "#ff70c8"],
      [0.68, 0.55, "R3", "#ffcf30"],
    ]
    ctx.setLineDash([8, 6])
    ctx.lineWidth = 2
    for (let i = 0; i < robots.length - 1; i += 1) {
      ctx.strokeStyle = robots[i][2].startsWith("R") ? "#42e1c6" : "#4d9dff"
      ctx.beginPath()
      ctx.moveTo(robots[i][0] * rect.width, robots[i][1] * rect.height)
      ctx.lineTo(robots[i + 1][0] * rect.width, robots[i + 1][1] * rect.height)
      ctx.stroke()
    }
    ctx.setLineDash([])
    robots.forEach(([x, y, label, color]) => {
      ctx.fillStyle = color
      roundedRect(ctx, x * rect.width - 18, y * rect.height - 14, 36, 28, 7)
      ctx.fill()
      ctx.fillStyle = "#07101a"
      ctx.font = "700 14px system-ui"
      ctx.fillText(label, x * rect.width - 10, y * rect.height + 5)
    })
  }

  drawLineChart(ctx, rect) {
    ctx.fillStyle = "#08111d"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "rgba(127, 143, 164, 0.18)"
    for (let i = 1; i < 5; i += 1) {
      const y = i * rect.height / 5
      ctx.beginPath()
      ctx.moveTo(24, y)
      ctx.lineTo(rect.width - 12, y)
      ctx.stroke()
    }
    const colors = ["#36d67a", "#4d9dff", "#b76cff", "#ffbb3c"]
    colors.forEach((color, s) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 42; i += 1) {
        const x = 24 + i * (rect.width - 44) / 41
        const y = rect.height * (0.55 + Math.sin(i * 0.42 + s) * 0.18 + Math.cos(i * 0.19 + s * 2) * 0.08)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    })
  }

  drawReplayTimeline(ctx, rect) {
    this.drawLineChart(ctx, rect)
    ctx.strokeStyle = "#f4f8ff"
    ctx.lineWidth = 2
    const playhead = rect.width * 0.38
    ctx.beginPath()
    ctx.moveTo(playhead, 20)
    ctx.lineTo(playhead, rect.height - 16)
    ctx.stroke()
    const labels = ["Start", "WP 1", "Box Pickup", "Door Pass", "Obstacle", "Goal"]
    ctx.font = "11px system-ui"
    labels.forEach((label, i) => {
      const x = 18 + i * (rect.width - 50) / (labels.length - 1)
      ctx.fillStyle = i === 4 ? "#ff6a5d" : "#4d9dff"
      roundedRect(ctx, x, 14, 68, 22, 4)
      ctx.fill()
      ctx.fillStyle = "#f4f8ff"
      ctx.fillText(label, x + 6, 29)
    })
  }

  drawDatasetLidar(ctx, rect) {
    this.drawLidar(ctx, rect)
    ctx.strokeStyle = "#ffcf30"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.2, rect.height * 0.78)
    ctx.lineTo(rect.width * 0.46, rect.height * 0.52)
    ctx.lineTo(rect.width * 0.7, rect.height * 0.26)
    ctx.stroke()
  }

  drawReplayVideo(ctx, rect) {
    this.drawWarehouse(ctx, rect)
    this.drawHumanoid(ctx, rect.width * 0.48, rect.height * 0.52, Math.min(rect.width, rect.height) * 0.52)
    ctx.fillStyle = "rgba(5, 10, 16, 0.72)"
    roundedRect(ctx, 12, 12, 72, 28, 4)
    ctx.fill()
    roundedRect(ctx, rect.width - 130, 12, 116, 28, 4)
    ctx.fill()
    ctx.fillStyle = "#f4f8ff"
    ctx.font = "12px system-ui"
    ctx.fillText("CAM 1", 25, 31)
    ctx.fillText("10:16:22 AM  REC", rect.width - 118, 31)
  }

  drawDonut(ctx, rect) {
    ctx.fillStyle = "#08111d"
    ctx.fillRect(0, 0, rect.width, rect.height)
    const cx = rect.width * 0.5
    const cy = rect.height * 0.5
    const r = Math.min(rect.width, rect.height) * 0.32
    const parts = [["#4d9dff", 0.73], ["#36d67a", 0.15], ["#b76cff", 0.12]]
    let start = -Math.PI / 2
    parts.forEach(([color, amount]) => {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.fillStyle = color
      ctx.arc(cx, cy, r, start, start + amount * Math.PI * 2)
      ctx.closePath()
      ctx.fill()
      start += amount * Math.PI * 2
    })
    ctx.fillStyle = "#08111d"
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#f4f8ff"
    ctx.font = "14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("123,418", cx, cy - 4)
    ctx.fillText("Samples", cx, cy + 16)
    ctx.textAlign = "start"
  }

  drawArm(ctx, rect) {
    ctx.fillStyle = "#09131f"
    ctx.fillRect(0, 0, rect.width, rect.height)
    const cx = rect.width * 0.5
    const cy = rect.height * 0.62
    ctx.strokeStyle = "#2f89ff"
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.36
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath()
      ctx.arc(cx, cy, i * 16 + 12, 0.05, 1.7)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.lineCap = "round"
    ctx.strokeStyle = "#6e8197"
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.moveTo(rect.width * 0.22, rect.height * 0.78)
    ctx.lineTo(rect.width * 0.45, rect.height * 0.48)
    ctx.lineTo(rect.width * 0.78, rect.height * 0.25)
    ctx.stroke()
    ctx.strokeStyle = "#2f89ff"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  drawHand(ctx, rect) {
    ctx.fillStyle = "#09131f"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "#2f89ff"
    ctx.lineWidth = 2
    const baseX = rect.width * 0.55
    const baseY = rect.height * 0.74
    for (let i = 0; i < 5; i += 1) {
      const x = baseX + (i - 2) * 18
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(x, rect.height * (0.28 + i * 0.02))
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, rect.height * (0.28 + i * 0.02), 5, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = "rgba(47, 137, 255, 0.16)"
    roundedRect(ctx, baseX - 30, baseY - 14, 60, 42, 8)
    ctx.fill()
    ctx.stroke()
  }

  drawTimeline(ctx, rect) {
    ctx.fillStyle = "#08111d"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "#273a52"
    ctx.beginPath()
    ctx.moveTo(18, 38)
    ctx.lineTo(rect.width - 18, 38)
    ctx.stroke()
    for (let i = 0; i < 18; i += 1) {
      const x = 20 + i * (rect.width - 40) / 17
      ctx.fillStyle = i % 4 === 0 ? "#ffbb3c" : i % 5 === 0 ? "#2f89ff" : "#43d17a"
      ctx.fillRect(x, 32, 8, 12)
    }
    for (let i = 0; i < 6; i += 1) {
      const x = 20 + i * (rect.width - 80) / 5
      this.drawMiniCameraAt(ctx, x, 68, Math.max(58, rect.width * 0.12), rect.height - 86)
    }
    ctx.fillStyle = "#9fb0c5"
    ctx.font = "11px system-ui"
    ctx.fillText("Teleop", 20, rect.height - 14)
    ctx.fillText("Waypoint", 90, rect.height - 14)
    ctx.fillText("Duration  00:12:48", rect.width - 168, rect.height - 14)
  }

  drawMiniCamera(ctx, rect) {
    this.drawMiniCameraAt(ctx, 0, 0, rect.width, rect.height)
  }

  drawMiniCameraAt(ctx, x, y, width, height) {
    ctx.save()
    ctx.translate(x, y)
    this.drawWarehouse(ctx, { width, height })
    this.drawHumanoid(ctx, width * 0.56, height * 0.62, Math.min(width, height) * 0.72)
    ctx.restore()
  }

  drawDepth(ctx, rect) {
    ctx.fillStyle = "#c8c8c8"
    ctx.fillRect(0, 0, rect.width, rect.height)
    for (let i = 0; i < 900; i += 1) {
      const x = (i * 47) % rect.width
      const y = (i * 89) % rect.height
      const v = 80 + ((i * 17) % 150)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, y, 3, 3)
    }
    ctx.fillStyle = "rgba(20,20,20,0.28)"
    roundedRect(ctx, rect.width * 0.36, rect.height * 0.22, rect.width * 0.26, rect.height * 0.58, 8)
    ctx.fill()
  }

  drawLidar(ctx, rect) {
    ctx.fillStyle = "#05101b"
    ctx.fillRect(0, 0, rect.width, rect.height)
    const cx = rect.width * 0.5
    const cy = rect.height * 0.55
    const radius = Math.min(rect.width, rect.height) * 0.42
    ctx.strokeStyle = "rgba(70, 130, 170, 0.24)"
    for (let r = radius * 0.25; r <= radius; r += radius * 0.25) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let i = 0; i < 420; i += 1) {
      const a = i / 420 * Math.PI * 2
      const rr = radius * (0.3 + ((i * 31) % 100) / 145 + Math.sin(a * 5) * 0.09)
      ctx.fillStyle = i % 3 === 0 ? "#43d17a" : i % 3 === 1 ? "#ffbb3c" : "#2f89ff"
      ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 2)
    }
  }

  drawHandCamera(ctx, rect, mode) {
    ctx.fillStyle = mode === "left_hand" ? "#11305a" : "#0c1b2c"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#1b65b7"
    roundedRect(ctx, rect.width * 0.42, rect.height * 0.18, rect.width * 0.48, rect.height * 0.62, 6)
    ctx.fill()
    this.drawHand(ctx, { width: rect.width * 0.75, height: rect.height * 0.9 })
  }
}
