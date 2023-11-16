<template lang="pug">
#webcam
  video(ref="video")
</template>

<script>
const CAPTURE_INTERVAL = 2500

const getFileDimensions = (blob) => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      URL.revokeObjectURL(img.src)
      resolve({ width, height })
    }
    img.src = url
  })
}

const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return { width: srcWidth * ratio, height: srcHeight * ratio }
}

const bmpToBlob = async (bmp) => {
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width
  canvas.height = bmp.height
  const ctx = canvas.getContext('bitmaprenderer')
  if (!ctx) return null
  ctx.transferFromImageBitmap(bmp)
  const blob = await new Promise((res) => canvas.toBlob(res))
  return blob
}

export default {
  name: 'Webcam',
  props: ['image'],
  data: () => ({
    interval: null,
    mediaStream: null
  }),
  methods: {
    async captureImage() {
      try {
        const mediaStreamTrack = this.mediaStream.getVideoTracks()[0]
        const imageCapture = new window.ImageCapture(mediaStreamTrack)
        const originalBlob = await imageCapture.takePhoto()

        // Get original photo dimensions
        const { width, height } = await getFileDimensions(originalBlob)

        // Calculate new width and height while keeping the aspect ratio
        const { width: resizeWidth, height: resizeHeight } =
          calculateAspectRatioFit(width, height, 512, 512)

        console.log(
          `--- log: capturde frame dimensions: ${width}x${height}, resized to ${resizeWidth}x${resizeHeight}`
        )

        // Resize image (max width/height 512/512)
        const bmp = await createImageBitmap(originalBlob, {
          resizeWidth,
          resizeHeight
        })

        // Convert BMP back to blob
        const blob = await bmpToBlob(bmp)
        if (!blob) throw new Error('Failed to create blob.')

        // Read as base64 encoded data URI
        const reader = new FileReader()
        reader.onload = () => {
          this.$emit('data', reader.result)
        }
        reader.readAsDataURL(blob)
      } catch (e) {
        console.log(e)
      }
    }
  },
  async mounted() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true
      })
      this.$refs.video.srcObject = this.mediaStream
      this.$refs.video.play()
      console.log('--- log: started webcam')

      this.captureImage()
      this.interval = setInterval(() => this.captureImage(), CAPTURE_INTERVAL)
    } catch (e) {
      console.log('--- log: failed to start webcam', e)
    }
  },
  beforeUnmount() {
    if (this.interval) clearInterval(this.interval)
  }
}
</script>

<style lang="stylus" scoped>
#webcam
  video
    width 100%
    border-radius 10px
</style>
